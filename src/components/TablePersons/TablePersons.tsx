import {useState} from "react";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Searcher from '../UIcomponents/Searcher';
import { IStructure, IRequest, IMember, ICollaborator, IPrivilege } from "../../interfaces/interfaces";
import requester from "../../helpers/Requester";
import { Tooltip } from "@mui/material";
import {MdDeleteForever, MdEditDocument} from 'react-icons/md'
import FormPerson from "../FormPersons/FormPerson";
import FormCollaborator from "../FormPersons/FormCollaborator";
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
  birthday: "",
  ine: "",
  gender: 0,
  id_strategy: 0,
  colony_name: "",
  postal_code: ""
}


const emptyCollaborator: ICollaborator = {
  id_collaborator: 0,
  first_name: "",
  last_name: "",
  street: "",
  ext_number: "",
  int_number: "",
  cell_phone_number: "",
  id_colony: 0,
  colony_name: "",
  postal_code: "",
  email: "",
  password: "",
  privileges: []
}

interface IStructureExtraFields extends IStructure {
  email?: string;
}

/*
  action = 0 Configuration for members
  action = 1 Configuration for collaborators
*/
const TablePersons = ({ action }:{ action:number }) => {
  //States
  const [personsFounded, setPersonsFounded] = useState<IStructureExtraFields[]>([]);
  const [memberBasicInfoToUpdate, setMemberBasicInfoToUpdate] = useState<IMember>();
  const [memberStrategicInfoToUpdate, setMemberStrategicInfoToUpdate] = useState<IStructure>();
  const [collaboratorBasicInfoToUpdate, setCollaboratorBasicInfoToUpdate] = useState<ICollaborator>();
  
  const [showForm, setShowForm] = useState<boolean>();

  //Reducer for alert message
  const dispatch:Dispatch<AnyAction> = useDispatch();
  const userData = useSelector((state: RootState) => state.userReducer);



  //Calls to API ---
  const deleteMember = async (idMember: number):Promise<number> => {
    try {
      const response:IRequest<undefined> = await requester({
        url: `/members/${idMember}`,
        method: 'DELETE'
      })

      if(response.code === 200) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.success, 
          message: "Se ha eliminado exitosamente al miembro"}}));
      } else {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "No se ha podido eliminar al miembro, intente nuevamente"}}));
      }
      return response.code;
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return 500;
    }
  }

  const deleteCollaborator = async (idCollaborator: number):Promise<number> => {
    try {
      const response:IRequest<undefined> = await requester({
        url: `/collaborators/${idCollaborator}`,
        method: 'DELETE'
      })

      if(response.code === 200) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.success, 
          message: "Se ha eliminado exitosamente al colaborador"}}));
      } else {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "No se ha podido eliminar al colaborador, intente nuevamente"}}));
      }
      return response.code;
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return 500;
    }
  }

  const searchMember = async(string_to_search: string):Promise<IStructure[]> => {
    try {
      const response:IRequest<IStructure[]> = await requester({
        url: `/members/search/${string_to_search}`,
        method: 'GET'
      })
      console.log(response);
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

  const searchCollaborator = async(string_to_search: string):Promise<ICollaborator[]> => {
    try {
      const response:IRequest<ICollaborator[]> = await requester({
        url: `/collaborators/search/${string_to_search}`,
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

  const getCollaboratorBasicInformation = async(idCollaborator: number):Promise<ICollaborator> => {
    try {
      const response:IRequest<ICollaborator[]> = await requester({
        url: `/collaborators/${idCollaborator}`
      })
      if(response.code === 200)
        if(response.data !== undefined)
          return response.data[0]

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Hubo problemas al momento de obtener la informacion colaborador, intente nuevamente"}}));
      return emptyCollaborator;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return emptyCollaborator;
    }
  }

  const getCollaboratorPrivileges = async (idCollaborator: number):Promise<IPrivilege[]> => {
    try {
      const response:IRequest<IPrivilege[]> = await requester({
        url: `/privileges/collaborator/${idCollaborator}`
      })
      if(response.code === 200)
        if(response.data !== undefined)
          return response.data

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Hubo problemas al momento de obtener la informacion colaborador, intente nuevamente"}}));
      return [];

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return [];
    }
  }


  // const gerCollaboratorPrivileges = async()
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
    
      if(personsToShow[0] === undefined) 
        if(action == 0) {
          setPersonsFounded(await searchMember(personToSearch));
        } else {
          const responseCollaborator:ICollaborator[] = 
            await searchCollaborator(personToSearch);
            console.log(responseCollaborator)
          const arrayConverter:IStructure[] = []

          responseCollaborator.forEach((collaborator) => {
            if(
                collaborator.id_collaborator !== undefined &&
                collaborator.first_name !== undefined &&
                collaborator.last_name !== undefined
              ) {
                arrayConverter.push({
                  id_member: collaborator.id_collaborator,
                  ...collaborator
                })
              }
          })
          
          console.log(arrayConverter)
          setPersonsFounded(arrayConverter);
        }
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

  const handleOnUpdate = async (idPerson:number) => {
    /*
      This handler is to get the member's or collaborato's data after the user found the "person" that wanted to update 
    */
    
    if(action==0) {
      //To updata member case
      //Get basic member's information  
      const basicMemberInformation:IMember = await getBasicMemberInformationById(idPerson);
  
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
    } else {
      //Get collaborator's basic information
      const dataCollaborator:ICollaborator 
        = await getCollaboratorBasicInformation(idPerson);
        
      if(dataCollaborator.id_collaborator !== 0) {
        //Get collaborator's privilege
        const dataPrivilege:IPrivilege[] = await getCollaboratorPrivileges(idPerson);
        
        //Save the result
        if(dataPrivilege[0] !== undefined) {
          dataCollaborator.privileges = dataPrivilege;
        }

        setCollaboratorBasicInfoToUpdate(dataCollaborator)
        setShowForm(true)     
      }
    }

  }  

  const handleOnDelete = async (idPerson:number) => {
    let response = 500;
    if(action == 0) {
      response = await deleteMember(idPerson);
    } else {
      response = await deleteCollaborator(idPerson);
    }

    if(response === 200)
      setPersonsFounded(personsFounded.filter(person => person.id_member !== idPerson))
  }
  
  return (
    <div className=""> 
      {
        (showForm===true) ?
        
        (

          action === 0 ?
          (<FormPerson
            label="Actualizar miembro"
            action={1}
            handleSubmit={handleOnSendData}
  
            initialPersonInformation={memberBasicInfoToUpdate}
            initialStrategicInformation={memberStrategicInfoToUpdate}
          />) :
          (<FormCollaborator
            label="Actualizar colaborador"
            action={1}
            handleSubmit={handleOnSendData}
  
            initialPersonInformation={collaboratorBasicInfoToUpdate}
          />)
        )
         :
        (<>
          <Searcher 
            handleSearcher={handleSearchPerson}
            placeholder={action === 0 ? "Buscar por nombre, telefono ó INE" :
              "Buscar por nombre, telefono ó e-mail"}/>
          {personsFounded[0] !== undefined &&          
          <Paper sx={{overflow: 'hidden'}}>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell align="center">ID</TableCell>
                    <TableCell align="center">Nombre</TableCell>
                    <TableCell align="center">Telefono</TableCell> 
                    <TableCell align="center">
                      {action === 0 ? "INE" : "E-mail"}
                    </TableCell>
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
                            {person.cell_phone_number}
                          </TableCell>
                          <TableCell align="center">
                            {action === 0 ? person.ine : person.email}
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
