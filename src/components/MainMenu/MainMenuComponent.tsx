import { useEffect, useState } from "react";
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import requester from "../../helpers/Requester";
import { IMember, IRequest, IStructure } from "../../interfaces/interfaces";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Tooltip } from "@mui/material";
import { MdEditDocument } from "react-icons/md";
import { BsCheckCircle } from "react-icons/bs";
import { MdErrorOutline } from "react-icons/md";
import FormPerson from "../FormPersons/FormPerson";

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

const emptyMemberStrategicInformation:IStructure = {
  id_member: 0
}


interface IMemberProfileIncomplete extends IMember {
  id_geographic_area: number;
}

const MainMenuComponent = () => {

  const [incompleteMembersProfile, setIncompleteMembersProfile] = useState<IMemberProfileIncomplete[]>([]);

  const [memberBasicInfoToUpdate, setMemberBasicInfoToUpdate] = useState<IMember>();
  const [memberStrategicInfoToUpdate, setMemberStrategicInfoToUpdate] = useState<IStructure>();
  const [showForm, setShowForm] = useState<boolean>(false);

  //Reducers for alerts message
  const dispatch:Dispatch<AnyAction> = useDispatch();
  const userData = useSelector((state: RootState) => state.userReducer);

  useEffect(() => {
    getMembersWithoutCompleteInformation()
    .then(response => {
      setIncompleteMembersProfile(response);
      console.log("DATA: ", response)
    });
  }, [])

  //Request to API
  const getMembersWithoutCompleteInformation = async():Promise<IMemberProfileIncomplete[]> => {
    try {
      const response:IRequest<IMemberProfileIncomplete[]> = await requester({
        url: `/members/profile/incomplete`,
        method: 'GET'
      })

      if(response.code === 200)
        if(response.data !== undefined)
          return response.data;

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar obtener los niveles de la estrategia"}}));
      return [];
        
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectar con el servidor"}}));
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

  // Handlers
  const handleOnUpdate = async(id_member:number|undefined):Promise<void> => {
    console.log(id_member);
    if(id_member) {
      //To updata member case
      //Get basic member's information  
      const basicMemberInformation:IMember = await getBasicMemberInformationById(id_member);
  
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
  }

  const handleOnSendData = async () => {
    /*
      This handler is executed to close PersonForm, after that we restart the
      array for search persons.
    */
    setShowForm(false);
    setIncompleteMembersProfile(
      await getMembersWithoutCompleteInformation());
  }

  return (
    <div className="flex flex-col">
      {showForm &&
        <FormPerson
        label="Actualizar miembro"
        action={1}
        handleSubmit={handleOnSendData}

        initialPersonInformation={memberBasicInfoToUpdate}
        initialStrategicInformation={memberStrategicInfoToUpdate}
      />
      }
      {(incompleteMembersProfile[0] !== undefined && showForm === false) &&
        <Paper sx={{overflow: 'hidden'}}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="center">ID</TableCell>
                  <TableCell align="center">Nombre</TableCell>
                  <TableCell align="center">Telefono</TableCell> 
                  <TableCell align="center">INE</TableCell> 
                  <TableCell align="center">Colonia</TableCell>
                  <TableCell align="center">Nivel jerarquico</TableCell>
                  <TableCell align="center">Lider</TableCell>
                  <TableCell align="center">Area geografica</TableCell>
                  <TableCell align="center">Editar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {
                  incompleteMembersProfile.map(person => {
                    return (
                      <TableRow key={person.id_member}>
                        <TableCell align="center">
                          {person.id_member}
                        </TableCell>
                        <TableCell align="center">
                          {person.last_name} {person.first_name}
                        </TableCell>
                        <TableCell align="center">
                          {person.cell_phone_number}
                        </TableCell>
                        <TableCell align="center">
                          {person.ine}
                        </TableCell>
                        <TableCell align="center">
                          <div className="text-lg flex flex-row justify-center">
                            {person.id_colony === null ?  
                              <div className="text-orange-400">
                                <MdErrorOutline />
                              </div>
                              :
                              <div className="text-green-400">
                                <BsCheckCircle />
                              </div>
                              }
                          </div>
                       </TableCell>
                        <TableCell align="center">
                          <div className="text-lg flex flex-row justify-center">
                            {person.id_strategy === null ?  
                              <div className="text-orange-400">
                                <MdErrorOutline />
                              </div>
                              :
                              <div className="text-green-400">
                                <BsCheckCircle />
                              </div>
                              }
                          </div>
                        </TableCell>
                        <TableCell align="center">
                          <div className="text-xl flex flex-row justify-center">
                            {person.id_leader === null ?  
                              <div className="text-orange-400">
                                <MdErrorOutline />
                              </div>
                              :
                              <div className="text-green-400">
                                <BsCheckCircle />
                              </div>
                              }
                          </div>
                        </TableCell>
                        <TableCell align="center">
                          <div className="text-xl flex flex-row justify-center">
                            {person.id_geographic_area === null ?  
                              <div className="text-orange-400">
                                <MdErrorOutline />
                              </div>
                              :
                              <div className="text-green-400">
                                <BsCheckCircle />
                              </div>
                              }
                          </div>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Editar">
                            <button
                            onClick={() => 
                              {handleOnUpdate(person.id_member)}}
                            className="text-sky-600 text-2xl">
                              <MdEditDocument />
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
    </div>
  )
}

export default MainMenuComponent;