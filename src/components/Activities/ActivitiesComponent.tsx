import { useEffect, useState } from "react";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Dialog, Tooltip } from "@mui/material";
import Searcher from "../UIcomponents/Searcher";
import Button from "../UIcomponents/Button";
import { IRequest, IActivity } from "../../interfaces/interfaces";
import requester from "../../helpers/Requester";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";
import { BsFillClipboard2CheckFill } from "react-icons/bs";
import { MdEditDocument, MdDeleteForever } from "react-icons/md";
import { FaInfoCircle } from "react-icons/fa";
import Forbbiden from "../Authorization/Forbbiden";
import Input from "../UIcomponents/Input";
import moment from 'moment';
import MessageAlert from "../UIcomponents/MessageAlert";

const initialActivity:IActivity = {
  id_activity: 0,
  name_activity: "",
  description_activity: "",
  expiration_date: "",
  creation_date: ""
}

const responseError:IRequest<undefined> = {
  message: "Internal error",
  data: undefined,
  code: 500
}

const validExpirationDay = (date:string):any => {
  if(date === "Invalid date") return undefined;

  if(date !== "" || date !== undefined || date !== null) 
    if(moment().diff(moment(date)) < 0) return true; 
    else  return false
  else return false;
  
}

const ActivitiesComponent = () => {

  // Privilege activity
  const [createActivityPrivilege, setCreateActivityPrivilege] = useState<boolean>(false);
  const [updateActivityPrivilege, setUpdateActivityPrivilege] = useState<boolean>(false);
  const [deleteActivityPrivilege, setDeleteActivityPrivilege] = useState<boolean>(false);

  // Operational states
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [dialog, setDialog] = useState<boolean>(false);
  const [dialogLeader, setDialogLeader] = useState<boolean>(false);
  const [typeOperation, setTypeOperation] = useState<number>(0);
  const [activitySelected, setActivitySelected] = useState<IActivity>(initialActivity);

  //Reducer for alert message
  const dispatch:Dispatch<AnyAction> = useDispatch();
  const userData = useSelector((state: RootState) => state.userReducer);

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

    getAllActivities()
    .then(responseDB => {
      console.log(responseDB)
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
        expiratioDate: activity.expiration_date
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

  // Handlers
  const handleOnCloseDialog = ():void => {
    restartOperation();
  }

  const handleCreateNewAcitivy = ():void => {
    setDialog(true);
    setTypeOperation(1);
  }

  const handleUpdateActivity = (activity:IActivity):void => {
    setActivitySelected(activity);
    setActivitySelected({...activity, 
      expiration_date: moment(activity.expiration_date).format("YYYY-MM-DD")});
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
    
    let response:IRequest<any> = responseError;

    if(typeOperation===1) {
      //Add activity
      response = await addActivity(activitySelected);
      //If the operation was a success, update the current data.
      if(response.code === 201) {
        //Remeber that the data is sorted from the new activity to the oldest
        //That means that we need to shift the data
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
        //Update in the state with the new data
        const index = activities
          .findIndex(activity => activity.id_activity === activitySelected.id_activity)

        activities[index] = activitySelected;
        setActivities(activities);
      }
      restartOperation();
    }
  }

  const handleOnOpenDialogMembers = ():void => {
    console.log("HOLA")
    setDialogLeader(true);
  }
  const handleOnCloseDialogMembers = ():void => {
    setDialogLeader(false);
  }

  //Auxiliar functions 
  const restartOperation = () => {
    setDialog(false);
    setTypeOperation(0);
    setActivitySelected(initialActivity);
  }

  return (
    <>
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
            {(validExpirationDay(activitySelected.expiration_date) === false) && 
              <MessageAlert label="El dia de expiración debe de ser posterior a hoy"/>
            }
          </div>
          <div className="flex flex-row justify-center">
            <Button label="Aceptar" onClick={handleOnSubmit}/>
            <Button label="Cancelar" colorButton={1} onClick={handleCancelOperation}/>
          </div>
        </div>
      </Dialog>
      <Dialog onClose={handleOnCloseDialogMembers} open={dialogLeader}>
       <div className="p-5 flex flex-col justify-center text-center">
        <p>Selecciona una opcion para </p>
        <Searcher placeholder="Buscar lider" />
        <div className="flex flex-row">
            <Button label="Buscar lider" />
            <Button label="Todos los miembros" />
            <Button label="Miembros faltantes" />
        </div>
       </div>
      </Dialog>
      {
        (createActivityPrivilege || updateActivityPrivilege || deleteActivityPrivilege) ?
        <div className="flex flex-col">
          <div className="flex flex-row items-align justify-between mb-3">
            <div className="mt-6">
              <Searcher 
                placeholder="Buscar tarea"
              />
            </div>
            {createActivityPrivilege && <Button onClick={handleCreateNewAcitivy} label="Crear tarea"/>}
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
                              { activity.expiration_date !== null ?
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
                                  if(updateActivityPrivilege !== false) {
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
        <Forbbiden />
      }
    </>
  )
}

export default ActivitiesComponent;