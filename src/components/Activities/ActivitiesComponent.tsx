import { useEffect, useState } from "react";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Dialog, Tooltip, Switch } from "@mui/material";
import Button from "../UIcomponents/Button";
import { IRequest, IActivity, IStructure, IActivityDone, IStrategy } from "../../interfaces/interfaces";
import requester from "../../helpers/Requester";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch } from 'react-redux';
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";
import { BsFillClipboard2CheckFill, BsPieChartFill } from "react-icons/bs";
import { MdEditDocument, MdDeleteForever } from "react-icons/md";
import { FaInfoCircle } from "react-icons/fa";
import Forbbiden from "../Authorization/Forbbiden";
import Input from "../UIcomponents/Input";
import moment from 'moment';
import MessageAlert from "../UIcomponents/MessageAlert";
import SearchMember from "../Searchers/SearchMember";
import { Chart as ChartJS, Legend, Tooltip as TooltipChart } from 'chart.js'; //Chart in general
import { ArcElement,  } from 'chart.js'; //Pie chart
import { Pie } from "react-chartjs-2";
import StrategyAutocomplete from "../Autocompletes/StrategyAutocomplete";
import SearchActivity from "../Searchers/SearchActivity";

ChartJS.register(ArcElement, TooltipChart, Legend); // Register for Pie Chart

const errorResponse:IRequest<any> = {
  code: 500,
  data: undefined,
  message: "error"
}


const initialActivity:IActivity = {
  id_activity: 0,
  name_activity: "",
  description_activity: "",
  expiration_date: "",
  creation_date: "",
  last_expiration_date: "",
  members_done: []
}

const responseError:IRequest<undefined> = {
  message: "Internal error",
  data: undefined,
  code: 500
}

interface IStructureActivity extends IStructure {
  activity_done: boolean;
}

const validExpirationDay = (expiration_date:string, last_expiration_date?:string):any => {
  let result = undefined;
  if(expiration_date === "Invalid date" || expiration_date === "") result = undefined;
  else {
    //That means that there is a possible date
    if(expiration_date !== "" || expiration_date !== undefined || expiration_date !== null) {
      if(last_expiration_date !== undefined || last_expiration_date !== null) {
        /*
          If it's yes, then this means that there is a previous "expiration date", 
          so we need to compare with it
        */
       //There isn't a new date
        if(moment(last_expiration_date).diff(moment(expiration_date)) === 0) result = true; 
        else {
          //The validate that the new expiration date is before of "today"
          if(moment().diff(moment(expiration_date)) < 0) result = true; 
          else  result = false;
        }
      } else {
        //The validate that the new expiration date is before of "today"
        if(moment().diff(moment(expiration_date)) < 0) result = true; 
        else  result = false;
      }
    } 
    else result = false;
  }

  return result;
}

const ActivitiesComponent = () => {

  // Privilege activity
  const [createActivityPrivilege, setCreateActivityPrivilege] = useState<boolean>(false);
  const [updateActivityPrivilege, setUpdateActivityPrivilege] = useState<boolean>(false);
  const [deleteActivityPrivilege, setDeleteActivityPrivilege] = useState<boolean>(false);
  const [visualizateStatisticsPrivilege, setVisualizateStatisticsPrivilege] = useState<boolean>(false);

  // Operational states
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [dialog, setDialog] = useState<boolean>(false);
  const [dialogSearchMember, setSearchMember] = useState<boolean>(false);
  const [statisticsView, setStatisticsView] = useState<boolean>(false);
  const [typeOperation, setTypeOperation] = useState<number>(0);
  const [activitySelected, setActivitySelected] = useState<IActivity>(initialActivity);
  const [memberToSearch, setMemberToSearch] = useState<IStructure|undefined>(undefined);
  const [memberToEvalute, setMemberToEvalute] = useState<IStructureActivity[]>([]);
  const [currentActivity, setCurrentActivity] = useState<number>(1);
  const [memberToSearchPrevention, setMemberToSearchPrevention] = useState<boolean>(false);
  const [searchActivityByName, setSearchActivityByName] = useState<boolean>(false);

  //Chart states
  const [currentStateOfTheActivity, setCurrentStateOfTheActivity] = useState<number[]>([]);
  const [currentStateOfTheActivityByStrucure, setCurrentStateOfTheActivityByStrucure] = useState<any[]|undefined>(undefined);


  //Auxiliar state to re-render memberToEvaluate array 
  const [helper, setHelper] = useState<boolean>(false);

  //Reducer for alert message
  const dispatch:Dispatch<AnyAction> = useDispatch();

  useEffect(() => {
    //Get create activity privilege
    requester({url: '/privileges/user/[31]', method: "GET"})
    .then(response => {
      setCreateActivityPrivilege(response.data.privilege);
    });
    //Get update activity privilege
    requester({url: '/privileges/user/[32]', method: "GET"})
    .then(response => {
      setUpdateActivityPrivilege(response.data.privilege);
    });
    //Get delete activity privilege
    requester({url: '/privileges/user/[33]', method: "GET"})
    .then(response => {
      setDeleteActivityPrivilege(response.data.privilege);
    });
    //Get statistics vizualization privilege
    requester({url: '/privileges/user/[42]', method: "GET"})
    .then(response => {
      setVisualizateStatisticsPrivilege(response.data.privilege);
    });

    getAllActivities()
    .then(responseDB => {
      
      const activitiesWithLastExpirationDay:IActivity[] = [];

      responseDB.forEach(activity => {
        activitiesWithLastExpirationDay.push({...activity, last_expiration_date: activity.expiration_date})
      })
      
      setActivities(responseDB);
    });
    
  }, [])  

  //Api request
  const getAllActivities = async ():Promise<IActivity[]> => {
    try {
      const response:IRequest<IActivity[]> = await requester({
        url: `/activities`
      })
      if(response.code === 200)
        if(response.data !== undefined)
          return response.data

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Hubo problemas al momento de obtener las actividades, intente nuevamente"}}));
      return [];

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return [];
    }
  }

  const addActivity = async(activity:IActivity):Promise<IRequest<any>> => {
    const wrongResponse:IRequest<any> = {
      message: "There was an error",
      code: 400,
      data: undefined
    }
    try {
      const data = {
        nameActivity: activity.name_activity,
        descriptionActivity: activity.description_activity,
        expiratioDate: activity.expiration_date
      }

      
      const response:IRequest<any> = await requester({
        url: "/activities",
        method: "POST",
        data: data
      });

      if(response.code === 201) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.success, 
          message: "Se ha agregado exitosamente la actividad"}}));  
        return response
      }
        
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Ha habido un problema al intentar crear la nueva actividad, intente nuevamente"}}));  
      return wrongResponse;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return wrongResponse;
    }
  }

  const updateActivity = async(activity:IActivity):Promise<IRequest<any>> => {
    const wrongResponse:IRequest<any> = {
      message: "There was an error",
      code: 400,
      data: undefined
    }
    try {
      const data = {
        nameActivity: activity.name_activity,
        descriptionActivity: activity.description_activity,
        expiratioDate: activity.expiration_date,
        lastExpirationDate: activity.last_expiration_date
      }

      
      const response:IRequest<any> = await requester({
        url: `/activities/${activity.id_activity}`,
        method: "PUT",
        data: data
      });

      
      if(response.code === 200) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.success, 
          message: "Se ha actualizado exitosamente la actividad"}}));  
        return response
      }
        
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Ha habido un problema al intentar actualizar la actividad, intente nuevamente"}}));  
      return wrongResponse;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return wrongResponse;
    }
  }

  const deleteActivity = async(activity:IActivity):Promise<IRequest<any>> => {
    const wrongResponse:IRequest<any> = {
      message: "There was an error",
      code: 400,
      data: undefined
    }
    try {      
      const response:IRequest<any> = await requester({
        url: `/activities/${activity.id_activity}`,
        method: "DELETE",
      });

      
      if(response.code === 200) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.success, 
          message: "Se ha eliminado exitosamente la actividad"}}));  
        return response
      }
        
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Ha habido un problema al intentar eliminar la actividad, intente nuevamente"}}));  
      return wrongResponse;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return wrongResponse;
    }
  }

  const setMemberDoneActiviy = async(activity:IActivity, listMembers:IStructureActivity[]):Promise<IRequest<any>> => {
    const wrongResponse:IRequest<any> = {
      message: "There was an error",
      code: 400,
      data: undefined
    }
    try {      
      const data:any = {
        arrayMembers: listMembers
      }
      const response:IRequest<any> = await requester({
        url: `activities/members/${activity.id_activity}`,
        method: "PUT",
        data: data
      });

      
      if(response.code === 200) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.success, 
          message: "Se ha actualizado los registros de la actividad"}}));  
        return response
      }
        
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Ha habido un problema al intentar actualizar los registros de la actividad, intente nuevamente"}}));

      return wrongResponse;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return wrongResponse;
    }
  }

  const getActivityId = async (id_activity:number):Promise<IActivity> => {
    try {
        const response:IRequest<IActivity[]>  = await requester({
          url: `/activities/${id_activity}`
        })
        
        if(response.code === 200)
          if(response.data !== undefined)
            return response.data[0]
  
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "Hubo problemas al momento de obtener las actividades, intente nuevamente"}}));
        return initialActivity;
  
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar conectarse al servidor"}}));
        return initialActivity;
      }
  }

  const getStructure = async ():Promise<IStructure[]> => {
  try {
      const response:IRequest<IStructure[]>  = await requester({
        url: '/data/structure'
      })
      
      if(response.code === 200)
      if(response.data !== undefined)
        return response.data

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Hubo problemas al momento de obtener las actividades, intente nuevamente"}}));
      return [];

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return [];
    }
  }

  const getMemberStructure = async (id_leader:number) => {
    try {
      const response:IRequest<IStructure[]>  = await requester({
        url: `/data/structure/strategyLevel/${id_leader}`
      })
      if(response.code === 200)
      if(response.data !== undefined)
        return response.data

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Hubo problemas al momento de obtener las actividades, intente nuevamente"}}));

      return [];  
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return [];   
    }
  }

  const getMembersDidNotPerformTask = async (id_activity:number) => {
    try {
      const response:IRequest<IStructure[]>  = await requester({
        url: `/activities/members/notPerform/${id_activity}`
      })
      if(response.code === 200)
      if(response.data !== undefined)
        return response.data

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Hubo problemas al momento de obtener las actividades, intente nuevamente"}}));

      return [];  
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return [];   
    }
  }

  const getCurrentStateOfActivity = async(id_activity:number):Promise<IRequest<any>> => {
    const defaultData = {
      "members_done": 0,
      "members_not_done": 0,
      "total": 0
    }
    errorResponse.data = defaultData;

    try {
      const response:IRequest<any> = await requester({
        url: `/activities/results/${id_activity}`
      })
      if(response.code === 200)
        if(response.data !== undefined)
          return response

      response.data = defaultData;
      if(response.code === 400) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "Hubo problemas al momento consultar el estado de la actividad, intente nuevamente"}}));
        return response
      }

      return response;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return errorResponse;
    }
  }

  const getCurrentStateOfActivityByStructure = async(id_activity:number, id_strategy:number):Promise<any[]> =>{
    try {
      const response:IRequest<any> = await requester({
        url: `/activities/results/${id_activity}/${id_strategy}`
      })
      if(response.code === 200)
        if(response.data !== undefined)
          return response.data;

      if(response.code === 400) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "Hubo problemas al momento consultar el estado de la actividad por estructura, intente nuevamente"}}));
      }

      return [];

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return [];
    }
  }
  
  // Handlers
  const handleOnCloseDialog = ():void => {
    restartOperation();
  }

  const handleCreateNewAcitivy = ():void => {
    setDialog(true);
    setTypeOperation(1);
  }

  const handleUpdateActivity = (activity:IActivity):void => {
    let expirationDate = moment(activity.expiration_date).format("YYYY-MM-DD");
    setActivitySelected({...activity, 
      expiration_date: expirationDate,
      last_expiration_date: expirationDate
    });
    setDialog(true);
    setTypeOperation(2);
  }
  
  const handleDeleteActivity = async (activityToDelete:IActivity):Promise<void> => {
    const response:IRequest<any> = await deleteActivity(activityToDelete);
    
    if(response.code === 200) {
      // If the deletion was successfull, then filter that activity
      setActivities(activities.filter(activity => activity.id_activity !== activityToDelete.id_activity)); 
    }
    restartOperation();
  }

  const handleCancelOperation = () => {
    restartOperation();
  }

  const handleOnSubmit = async (e:any) => {
    e.preventDefault();
  
    if(
      activitySelected.name_activity === '' ||
      activitySelected.description_activity === ''
      ){
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "Llena todos los campos obligatorios"}}));
        return;
    }
    
    if(activitySelected.expiration_date === "Invalid date") {
      activitySelected.expiration_date = "";
    }

    let response:IRequest<any> = responseError;

    if(typeOperation===1) {
      //Add activity
      response = await addActivity(activitySelected);
      //If the operation was a success, update the current data.
      if(response.code === 201) {
        //Remeber that the data is sorted from the new activity to the oldest
        //That means that we need to shift the arrray.
        const newArrActivities = [];

        activitySelected.creation_date = moment().format();

        newArrActivities.push(activitySelected)

        for(let i = 0; i < activities.length; i++) {
          newArrActivities.push(activities[i]);
        }

        setActivities(newArrActivities);
        restartOperation();
      }
    } else if(typeOperation===2) {
      //Update an activiy
      response = await updateActivity(activitySelected);

      if(response.code === 200) {
        //Find the index of the activity that was just updated
        const index = activities
          .findIndex(activity => activity.id_activity === activitySelected.id_activity)

        // In the position of the "index" in the array, update the state with the new data 
        activities[index] = activitySelected; 
        setActivities(activities);
      }
      restartOperation();
    }
  }

  const handleOnOpenDialogMembers = ():void => {
    setSearchMember(true);
  }

  const handleOnOpenStatistics = (activity: IActivity):void => {
    setStatisticsView(true);
    setCurrentActivity(3);
    setActivitySelected(activity);

    //Get general statistics of an activity
    getCurrentStateOfActivity(activity.id_activity)
    .then(response => {
      const {code, data} = response;
      setCurrentStateOfTheActivity([data.members_done, data.members_not_done]);
    });
  }

  const handleOnCloseDialogMembers = ():void => {
    setSearchMember(false);
  }

  const handleSearchMember = async (typeOfSearch:number):Promise<void> => {
    let members:IStructure[] = [];
    let activity:IActivity = initialActivity;
    let membersToAssess:IStructureActivity[] = [];
    let membersDone:IActivityDone[] = [];

    // Determine which kind of searched want the user 
    if(typeOfSearch === 1) {
      //Search in the structure
      if(memberToSearch !== undefined) {
        setMemberToSearchPrevention(false);
        members = await getMemberStructure(memberToSearch.id_member);
      } else {
        setMemberToSearchPrevention(true);
        return;
      }
    } else if(typeOfSearch === 2) {
      //All the members
      members = await getStructure();
    } else {
      //Members that doesn't still make the activity
      if(activitySelected.id_activity !== undefined)
        members = await getMembersDidNotPerformTask(activitySelected.id_activity);
    }

    //Sort the result by "first name"
    const membersFiltered = members.sort(function(a,b) {
      if(a.first_name !== undefined && b.first_name !== undefined) {
        if (a.first_name > b.first_name) {
            return 1;
        }
        if (a.first_name < b.first_name) {
            return -1;
        }
      }
      // a must be equal to b
      return 0;
    });

    //If there are members in the results of the search
    if(membersFiltered[0] !== undefined) {
      //Get the activity to evaluate
      if(activitySelected.id_activity !== undefined)
      activity = await getActivityId(activitySelected.id_activity);
    }

    // Just narrowing
    if(activity.members_done !== undefined) {
      // Determine who carried out the activity and who didn't
      membersDone = activity.members_done;
      membersFiltered.forEach(member => {
        if(membersDone.find(memberDone => memberDone.id_member === member.id_member) !== undefined) {
          membersToAssess.push({
            ...member,
            activity_done: true
          });
        } else {
          membersToAssess.push({
            ...member,
            activity_done: false
          });
        }
      }) 
    }

    setSearchMember(false);
    setMemberToEvalute(membersToAssess);
    setCurrentActivity(2);
  }


  const handleChangeStatus = (idMember:number) => {
    /* 
      This function helps to change the status between done and haven't done to a user
      respecting to an acitivty
    */
    const index:number|undefined = memberToEvalute
      .findIndex(person => person.id_member === idMember)

    memberToEvalute[index].activity_done =  !memberToEvalute[index].activity_done;

    setHelper(!helper);
  }

  const handleFinshEvaluation = async():Promise<void> => {
    const response:IRequest<any> = await setMemberDoneActiviy(activitySelected, memberToEvalute);

    if(response.code===200) 
      restartOperation();
    
  }

  const handleCancelEvalutation = ():void => {
    restartOperation();
  }

  const handleSearchByAcitivy = async (strategy:IStrategy|undefined):Promise<void> => {
    if(strategy!==undefined) {
      const responseDB = 
        await getCurrentStateOfActivityByStructure(activitySelected.id_activity, strategy.id_strategy);
      setCurrentStateOfTheActivityByStrucure(responseDB);
    } else {
      setCurrentStateOfTheActivityByStrucure(undefined);
    }
  }

  const handleSearchActivityByName = async (activity:IActivity|undefined) => {
    if(activity !== undefined) {
      const responseDB:IActivity = await getActivityId(activity.id_activity);
      setActivities([ responseDB ]);
      setSearchActivityByName(true);
    }
  }

  const handleCancelSearchByName = async() => {
    setSearchActivityByName(false)
    const responseDB = await getAllActivities();
    setActivities(responseDB);
  }

  //Auxiliar functions 
  const restartOperation = () => {
    setDialog(false);
    setTypeOperation(0);
    setActivitySelected(initialActivity);
    setCurrentActivity(1);
    setMemberToEvalute([]);
    setMemberToSearch(undefined);
    setMemberToSearchPrevention(false);
  }

  return (
    <>
      {/* Dialog for manage the activities */}
      <Dialog  onClose={handleOnCloseDialog} open={dialog}>
        <div className="w-72 p-5 flex flex-col justify-center text-center">
          <div className="text-lg font-bold">
            {typeOperation===1 && <p>Crear nueva actividad</p>}
            {typeOperation===2 && <p>Actualizar actividad</p>}
            {typeOperation===3 && <p>Buscar lider actividad</p>}
          </div>
          <div className="flex flex-col">
            <p className="mt-3 font-bold">Nombre de la actividad</p>
            <Input
              onType={setActivitySelected}
              objectValue={activitySelected} 
              inputName={"name_activity"}
              placeholder={'Nombre de la actividad'}
              inputType={'text'}
              required={true}
              />
            <p className="mt-3 font-bold">Descripción de la actividad</p>
            <Input
              onType={setActivitySelected}
              objectValue={activitySelected} 
              inputName={"description_activity"}
              placeholder={'Descripción de la actividad'}
              inputType={'text'}
              required={true}
              />
            <p className="mt-3 font-bold">Fecha de vencimiento (opcional)</p>
            <Input
              onType={setActivitySelected}
              objectValue={activitySelected} 
              inputName={"expiration_date"}
              placeholder={'Expiración de la actividad'}
              inputType={'date'}
              />
            {(validExpirationDay(activitySelected.expiration_date, activitySelected.last_expiration_date) === false) && 
              <MessageAlert label="El dia de expiración debe de ser posterior a hoy"/>
            }
          </div>
          <div className="flex flex-row justify-around mt-3">
            <Button label="Aceptar" onClick={handleOnSubmit}/>
            <Button label="Cancelar" colorButton={1} onClick={handleCancelOperation}/>
          </div>
        </div>
      </Dialog>

      {/* Dialog for search the member */}
      <Dialog onClose={handleOnCloseDialogMembers} open={dialogSearchMember}>
       <div className="w-auto p-4 flex flex-col justify-center text-center">
        <p className="my-2">Selecciona una opcion para </p>
        <div className="flex flex-col">
          <div className="flex flex-row items-center my-2">
              <SearchMember onSelectItem={setMemberToSearch}/>
              <div>
                <Button onClick={() =>{ handleSearchMember(1) }} label="Buscar miembro" style="ml-5"/>
              </div>
          </div>
          { memberToSearchPrevention &&
            <MessageAlert label="Debes escoger un miembro para proceder con la busqueda" />
          }
        </div>
      
        <div className="flex flex-row justify-around my-2">
          <Button onClick={() => { handleSearchMember(2) }} label="Todos los miembros" />
          <Button onClick={() => {handleSearchMember(3)}} label="Miembros faltantes" />
        </div>
       </div>
      </Dialog>
      
      {/* Table to select who carried out the activity */}
      { currentActivity === 2 &&
        <>
          {(memberToEvalute[0] !== undefined) ?
            <div className="flex flex-col">
              <p className="font-bold text-lg text-center mb-3">
                Resultados de la busquesa (lider y seguidores)
              </p>
              <Paper sx={{overflow: 'hidden'}}>
                <TableContainer sx={{ maxHeight: 440 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell align="center">ID del miembro</TableCell>
                        <TableCell align="center">Nombre del miembro</TableCell>
                        <TableCell align="center">Rol del miembro</TableCell>
                        <TableCell align="center">¿Realizo la actividad?</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {
                        memberToEvalute.map(member => {
                          return (
                            <TableRow key={member.id_member}>
                              <TableCell align="center">
                                {member.id_member}
                              </TableCell>
                              <TableCell align="center">
                                {member.first_name} {member.last_name}
                              </TableCell>
                              <TableCell align="center">
                                {member.role}
                              </TableCell>
                              <TableCell align="center">
                                <Switch 
                                  checked={member.activity_done === true ? true : false}
                                  onChange={() => {handleChangeStatus(member.id_member)}}
                                  />
                              </TableCell>
                            </TableRow>
                          )
                        })
                      }
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper> 
            </div> : 
            <p className="text-center font-bold text-lg">
              No se encontro ningun miembro
            </p>
          }
          <div className="mt-3 flex flex-row basis-1/2 justify-around">
            <Button label="Aceptar" onClick={handleFinshEvaluation}/>
            <Button label="Cancelar" colorButton={1} onClick={handleCancelEvalutation}/>
          </div>
        </>
      }

      {/* Table to show statistics */}
      {(statisticsView === true && currentActivity === 3) &&
        <div className="flex flex-col">
          <div className="flex justify-center mb-5 font-bold text-2xl">
            <p>Estadisticas de la actividad</p>
          </div>
          <div className="flex flex-row">
          <div>
            <div className="flex justify-center">
              Grafico general de "toda" la estructura
            </div>
            <Pie data={
                      {
                        labels: ['Han hecho la actividad', 'No han hecho la actividad'],
                        datasets: [
                          {
                            label: `# miembros`,
                            data: currentStateOfTheActivity,
                            backgroundColor: [
                              'rgba(54, 162, 235, 0.2)',
                              'rgba(255, 99, 132, 0.2)',
                            ],
                            borderColor: [
                              'rgba(54, 162, 235, 1)',
                              'rgba(255, 99, 132, 1)',
                            ],
                            borderWidth: 1,
                          },
                        ],
                      }
            }/>
          </div>
            <div>
              <div className="flex justify-center">
                Grafico por lider
              </div>
              <div className="flex justify-center mb-3">
                <StrategyAutocomplete onSelect={handleSearchByAcitivy} />
              </div>
              {currentStateOfTheActivityByStrucure !== undefined &&
                <>
                  {currentStateOfTheActivityByStrucure[0] !== undefined &&
                    <Paper sx={{overflow: 'hidden'}}>
                    <TableContainer sx={{ maxHeight: 440 }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell align="center">
                              Nombre de lider
                            </TableCell>
                            <TableCell align="center">
                              Seguidores que han cumplido (contando al lider)
                            </TableCell>
                            <TableCell align="center">
                              Total de su estructura (contando al lider)
                            </TableCell>
                            <TableCell align="center">
                              Compromiso de estructura (contando al lider)
                            </TableCell> 
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {
                            currentStateOfTheActivityByStrucure.map(activity => {
                              return (
                                <TableRow key={activity.id_member}>
                                  <TableCell align="center">
                                    {activity?.first_name} {activity?.last_name} 
                                  </TableCell>
                                  <TableCell align="center">
                                    {activity?.structure_done}
                                  </TableCell>
                                  <TableCell align="center">
                                    {activity?.total_structure}
                                  </TableCell>
                                  <TableCell align="center">
                                    {activity?.structure_compromise}%
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
                </>
              }
            </div>
          </div>
          <div className="mt-3 flex flex-row basis-1/2 justify-around">
            
            <Button label="Volver" colorButton={0} onClick={handleCancelEvalutation}/>
          </div>
        </div>
      }

      {
        ((createActivityPrivilege || updateActivityPrivilege || deleteActivityPrivilege || visualizateStatisticsPrivilege) && currentActivity === 1) ?
        <div className="flex flex-col">
          <div className="flex flex-row items-align justify-between my-3">
            <div className="flex flex-row">
              <SearchActivity onSelectItem={handleSearchActivityByName}/>
              <div className="ml-3">
                { searchActivityByName &&
                  <Button label="Cancelar busqueda" colorButton={1} onClick={handleCancelSearchByName}/>
                }
              </div>
            </div>
            {createActivityPrivilege && 
              <Button onClick={handleCreateNewAcitivy} label="Crear tarea"/>}
          </div>
          <div className="flex flex-col">
            <Paper sx={{overflow: 'hidden'}}>
              <TableContainer sx={{ maxHeight: 440 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">Nombre actividad</TableCell>
                      <TableCell align="center">Fecha de vencimineto</TableCell>
                      <TableCell align="center">Fecha de creación</TableCell>
                      <TableCell align="center">Descripción</TableCell> 
                      <TableCell align="center">Estadisticas</TableCell> 
                      <TableCell align="center">Miembros que han cumplido</TableCell>
                      <TableCell align="center">Actualizar tarea</TableCell>
                      <TableCell align="center">Eliminar</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {
                      activities.map(activity => {
                        return (
                          <TableRow key={activity.id_activity}>
                            <TableCell align="center">
                              {activity.name_activity}
                            </TableCell>
                            <TableCell align="center">
                              { (activity.expiration_date !== null && activity.expiration_date !== "") ?
                                moment(activity.expiration_date).format("DD-MM-YYYY") :
                                "No expira"}
                            </TableCell>
                            <TableCell align="center">
                              {moment(activity.creation_date).format("DD-MM-YYYY")}
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title={activity.description_activity}>
                                <div className="text-2xl flex flex-row justify-center">
                                  <FaInfoCircle />
                                </div>
                              </Tooltip>
                            </TableCell>
                            <TableCell align="center">
                              <button
                                onClick={() => {
                                  if(visualizateStatisticsPrivilege !== false) {
                                    handleOnOpenStatistics(activity)
                                  }
                                }}>
                                <div 
                                className={
                                  (visualizateStatisticsPrivilege)  ?
                                  "text-2xl" : "text-2xl text-slate-400"
                                  }>
                                  <BsPieChartFill />
                                </div>
                              </button>
                            </TableCell>
                            <TableCell align="center">
                              <button
                                onClick={() => {
                                  if(updateActivityPrivilege !== false) {
                                    setActivitySelected(activity)
                                    handleOnOpenDialogMembers()
                                  }
                                }}
                              >
                                <div 
                                  className={
                                    (updateActivityPrivilege)  ?
                                    "text-2xl" : "text-2xl text-slate-400"
                                  }
                                >
                                  <BsFillClipboard2CheckFill />
                                </div>
                              </button>
                            </TableCell>
                            <TableCell align="center">
                              <button 
                                onClick={() => {
                                  if(updateActivityPrivilege !== false) {
                                    handleUpdateActivity(activity)
                                  }
                                }}
                              >
                                <div 
                                  className={
                                    (updateActivityPrivilege)  ?
                                    "text-2xl" : "text-2xl text-slate-400"
                                  }
                                >
                                  <MdEditDocument />
                                </div>
                              </button>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Eliminar">
                                <button 
                                  onClick={() => {
                                    if(deleteActivityPrivilege !== false) {
                                      handleDeleteActivity(activity);
                                    }
                                  }}
                                className="text-2xl"
                                >
                                  <div
                                    className={
                                      (deleteActivityPrivilege) ?
                                      "text-3xl" : "text-3xl text-slate-400"
                                    }
                                  >
                                    <MdDeleteForever />
                                  </div>
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
          </div>
        </div> :
        <>
          {(currentActivity===1) &&
            <Forbbiden />
          }
        </>
        
      }
    </>
  )
}

export default ActivitiesComponent;