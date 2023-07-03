import {useState} from "react";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Searcher from '../UIcomponents/Searcher';
import { IStructure, IRequest, IMember } from "../../interfaces/interfaces";
import requester from "../../helpers/Requester";
import { Tooltip } from "@mui/material";
import {MdDeleteForever, MdEditDocument} from 'react-icons/md'
import FormPerson from "../FormPersons/FormPerson";
import { CircularProgress } from "@mui/material";
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

const emptyMemberStrategicInformation:IStructure = {
  id_member: 0
}

const emptyMember: IMember = {
  id_member: 0,
  first_name: "",
  last_name: "",
  street: "",
  ext_number: "",
  int_number: "",
  cell_phone_number: "",
  id_leader: 0,
  id_follower: [],
  id_colony: 0,
  id_strategy: 0,
  colony_name: "",
  postal_code: ""
}

const TablePersons = () => {
  //States
  const [personsFounded, setPersonsFounded] = useState<IStructure[]>([]);
  const [memberBasicInfoToUpdate, setMemberBasicInfoToUpdate] = useState<IMember>();
  const [memberStrategicInfoToUpdate, setMemberStrategicInfoToUpdate] = useState<IStructure>();
  const [showForm, setShowForm] = useState<boolean>();

  //Reducer for alert message
  const dispatch:Dispatch<AnyAction> = useDispatch();
  const userData = useSelector((state: RootState) => state.userReducer);



  //Calls to API
  const deleteMember = async (idMember: number):Promise<void> => {
    try {
      const response:IRequest<undefined> = await requester({
        url: `/members/${idMember}`,
        method: 'DELETE'
      })

      if(response.code === 200) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Se ha eliminado exitosamente al miembro"}}));
        } else {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "No se ha podido eliminar al miembro, intente nuevamente"}}));
      }
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
    }
  }

  const searchMember = async(nameMember: string):Promise<IStructure[]> => {
    try {
      const response:IRequest<IStructure[]> = await requester({
        url: `/members/name/${nameMember}`,
        method: 'GET'
      })

      if(response.code === 200) 
        if(response.data !== undefined) 
          return response.data;
        
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Ha habido un problema al intentar hacer la busqueda, intente nuevamente"}}));  
      return [];
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return [];
    }
  }

  const getBasicMemberInformationById = async(idMember: number):Promise<IMember> => {

    try {
      const response:IRequest<IMember[]> = await requester({
        url: `/members/${idMember}`,
        method: 'GET'
      })

      if(response.code === 200) 
        if(response.data !== undefined)
          return response.data[0];

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Hubo problemas al momento de obtener la informacion, intente nuevamente"}}));
      return emptyMember;
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return emptyMember;
    }
  }

  const getStrategicMemberInformation = async (idMember: number):Promise<IStructure> => {
    try {
      const response:IRequest<IStructure[]> = await requester({
        url: `/members/strategicInformation/${idMember}`
      })

      if(response.code === 200)
        if(response.data !== undefined)
          return response.data[0]

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Hubo problemas al momento de obtener la informacion estrategica del miembro, intente nuevamente"}}));
      return emptyMemberStrategicInformation;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return emptyMemberStrategicInformation;
    }
  }

  const getLeaderOfTheMemberById = async(idLeader: number):Promise<IMember> => {
    try {
      const response:IRequest<IMember[]> = await requester({
        url: `/members/${idLeader}`
      })
      if(response.code === 200)
        if(response.data !== undefined)
          return response.data[0]

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Hubo problemas al momento de obtener la informacion del lider del miembro, intente nuevamente"}}));
      return emptyMember;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return emptyMember;
    }
  }

  //Handlers ---
  const handleSearchPerson = async (personToSearch: string) => {
    /*
      First the function tries to filter with the new inputs of the user, 
      if there isn't coincidences, then we call to API to search members that matches
      with the user's input and return it, otherwise, return the result of what was filtered
    
    */
    const re = new RegExp(`^${personToSearch.toLowerCase()}[a-zA-Z0-9\ \d\D]*`);
    
    const personsToShow:IStructure[] = personsFounded.filter(person => {
        const name = `${person.first_name} ${person.last_name}`;
        if(re.test(name.toLocaleLowerCase()) === true) 
          return person
      })
    
      if(personsToShow[0] === undefined) setPersonsFounded(await searchMember(personToSearch));
       else setPersonsFounded(personsToShow)

  }

  const handleOnSendData = async () => {
    /*
      This handler is executed to close PersonForm, after that we restart the
      array for search persons.
    */
    setShowForm(false)
    setPersonsFounded([])
  }

  const handleOnUpdate = async (idMember:number) => {
    /*
      This information is to get the member's data after the user found the member that wanted to update 
    */
    
    //To updata member case
    //Get basic member's information  
    const basicMemberInformation:IMember = await getBasicMemberInformationById(idMember);

    //Get strategic member's information case
    if(basicMemberInformation.id_member !== 0 &&
      basicMemberInformation.id_member !== undefined) {
      setMemberBasicInfoToUpdate(basicMemberInformation);
      //Get strategic information
      const strategicMemberInformation:IStructure 
        = await getStrategicMemberInformation(basicMemberInformation.id_member)
        
      if(strategicMemberInformation.id_member !== 0) {
        // If the member has a leader        
        if(strategicMemberInformation.id_leader !== null &&
          strategicMemberInformation.id_leader !== undefined
          ) {
          const leaderData:IMember = await getLeaderOfTheMemberById(strategicMemberInformation.id_leader);
          strategicMemberInformation.first_name_leader=leaderData.first_name 
          strategicMemberInformation.last_name_leader = leaderData.last_name  
        } 
              
        if (strategicMemberInformation.first_name_leader === undefined)
          strategicMemberInformation.first_name_leader = '' 
        if (strategicMemberInformation.last_name_leader === undefined)
          strategicMemberInformation.last_name_leader= '' 
        
        setMemberStrategicInfoToUpdate(strategicMemberInformation)
        setShowForm(true)             
      }
    } 
  }  

  const handleOnDelete = async (idPerson:number) => {
    await deleteMember(idPerson)
  }
  
  return (
    <div className=""> 
      {
        (showForm===true) ?
        (<FormPerson
          label="Actualizar miembro"
          action={1}
          handleSubmit={handleOnSendData}

          initialPersonInformation={memberBasicInfoToUpdate}
          initialStrategicInformation={memberStrategicInfoToUpdate}
        />) :
        (<>

          <Searcher handleSearcher={handleSearchPerson}/>
          {personsFounded[0] !== undefined &&          
          <Paper sx={{overflow: 'hidden'}}>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell align="center">ID</TableCell>
                    <TableCell align="center">Nombre</TableCell>
                    <TableCell align="center">Modificar</TableCell>
                    <TableCell align="center">Eliminar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {
                    personsFounded.map(person => {
                      return (
                        <TableRow key={person.id_member}>
                          <TableCell align="center">
                            {person.id_member}
                          </TableCell>
                          <TableCell align="center">
                            {person.first_name} {person.last_name}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Editar">
                              <button
                              onClick={() => 
                                {handleOnUpdate(person.id_member)}}
                              className="text-2xl">
                                <MdEditDocument />
                              </button>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Eliminar">
                              <button onClick={() => 
                                {handleOnDelete(person.id_member)}}
                              className="text-2xl">
                                <MdDeleteForever />
                              </button>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  }
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          }
        </>)
      }
    </div>
  )
}

export default TablePersons;
