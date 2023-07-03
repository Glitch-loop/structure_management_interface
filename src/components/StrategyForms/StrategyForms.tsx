import { MdEdit } from "react-icons/md";
import { BsFillTrashFill } from "react-icons/bs";
import { useEffect, useState } from "react";
import { IStrategy, IRequest } from "../../interfaces/interfaces";
import requester from "../../helpers/Requester";
import { FiPlus } from "react-icons/fi"
import { Dialog } from "@mui/material";
import Button from "../UIcomponents/Button";
import Input from "../UIcomponents/Input";
import { CircularProgress } from "@mui/material";
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';


const initialStrategyState = {
  id_strategy: 0,
  zone_type: "",
  role: "",
  cardinality_level: 0
}

const StrategyForms = () => {
  const [strategyLevels, setStrategyLevels] = useState<IStrategy[]|undefined>(undefined);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  /*
    Depends of the number stored in the state, is the type of operation
    that the user currently are performed
    0 = none
    1 = add level
    2 = modify level
    3 = delete level
  */
  const [typeOperation, setTypeOperation] = useState<number>(0);
  const [targetLevel, setTargetLevel] = useState<IStrategy>(initialStrategyState);

  //Reducers for alerts
  const dispatch:Dispatch<AnyAction> = useDispatch();
  const userData = useSelector((state: RootState) => state.userReducer);

  useEffect(()=>{
    getStrategy().then((data) => setStrategyLevels(data));
  },[])

  // Calls to API
  const getStrategy = async():Promise<IStrategy[]> => {
    try {
      const response:IRequest<IStrategy[]> = await requester({
        url: `/strategyLevels`,
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
  
  
  const deleteStrategyLevel = async(idStrategyLevel: number):Promise<IRequest<undefined>> => {
    try {
      const response:IRequest<undefined> = await requester({
        url: `/strategyLevels/${idStrategyLevel}`,
        method: 'DELETE'
      })
      if(response.code === 200) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.success, 
          message: "El nivel de la estrategia se ha eliminado exitosamente"}}));
      } else {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar eliminar el nivel de la estrategia"}}));
      }
      return response;
    } catch (error) {
    dispatch(enqueueAlert({alertData: {
      alertType: EAlert.error, 
      message: "Hubo un error al intentar conectar con el servidor"}}));  
      const response:IRequest<undefined> = {
        message: "error",
        code: 500
      } 
      return response;  
    }
  }
  
  const updateStrategyLevel = async(strategyLevel: IStrategy): Promise<IRequest<undefined>> => {
    try {
      const data = {
        roleName: strategyLevel.role,
        zoneType: strategyLevel.zone_type
      }
      const response:IRequest<undefined> = await requester({
        url: `/strategyLevels/${strategyLevel.id_strategy}`,
        method: 'PUT',
        data: data
      })
      
      if(response.code === 200) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.success, 
          message: "El nivel de la estrategia se ha actualizado exitosamente"}}));
      } else {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar actualizar el nivel de la estrategia"}}));
      }
      console.log(response)
      return response;
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectar con el servidor"}}));   
      const response:IRequest<undefined> = {
        message: "error",
        code: 500
      } 
      return response;   
    }
  }

  const addStrategyLevel = async(strategyLevel: IStrategy): Promise<IRequest<undefined>> => {
    try {
      const data = {    
        roleName: strategyLevel.role,
        zoneType: strategyLevel.zone_type,
        cardinalityLevel: strategyLevel.cardinality_level
      }
      const response:IRequest<undefined> = await requester({
        url: `/strategyLevels`,
        method: 'POST',
        data: data
      })
      if(response.code === 201) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.success, 
          message: "Se ha agregado el nivel a la estrategia exitosamente"}}));
      } else {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar agregar el nuevo nivel a la estrategia"}}));
      }
      return response
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectar con el servidor"}}));    
      const response:IRequest<undefined> = {
        message: "error",
        code: 500
      } 
      return response;   
    }

  }

  //Handlers
  const handleOnCloseDialog = ():void => {
    setShowDialog(false)
  }

  const handleInitializeOperation = (strategyLevel: IStrategy, typeOperation: number):void => {
    if(typeOperation===1) {
      const newStrategyLevel:IStrategy = {
        id_strategy: 0,
        zone_type: "",
        role: "",
        cardinality_level: strategyLevel.cardinality_level
      }
      setTargetLevel(newStrategyLevel);
    } else setTargetLevel(strategyLevel);
    
    setTypeOperation(typeOperation);
    setShowDialog(true);
  }

  const handlerCancelOperation = ():void => {
    setTypeOperation(0);
    setShowDialog(false);
  }

  const handlePerfomOperation = async():Promise<void> => {
    if(targetLevel !== undefined) {
        let response:IRequest<undefined>|undefined = undefined;
      if(typeOperation === 1) {
        response = await addStrategyLevel(targetLevel);
        console.log("Status response: ", response)
        if(response?.code === 201) {
          setStrategyLevels(await getStrategy())
        }
      } else if(typeOperation === 2) {
         response = await updateStrategyLevel(targetLevel);
         if(response?.code === 200) {
          if(strategyLevels !== undefined) {
            const index:number = strategyLevels.findIndex(strategyLevel => strategyLevel.id_strategy === targetLevel.id_strategy);
            strategyLevels[index] = targetLevel
            setStrategyLevels(strategyLevels)
          }
        }
      } else if(typeOperation === 3) {
        response = await deleteStrategyLevel(targetLevel.id_strategy);
        if(response?.code === 200) {
          setStrategyLevels(await getStrategy())
        }
      }
    }
    setTypeOperation(0);
    setShowDialog(false);
    setTargetLevel(initialStrategyState);
  }

  return(
    <div className="w-10/12 h-5/6 p-5 bg-neutral-100 rounded-lg overflow-auto">
      <Dialog onClose={handleOnCloseDialog} open={showDialog}>
        <div className="p-5">
          {(typeOperation===1 || typeOperation===2) &&
            (<>
              <p className="text-lg text-center">
                {typeOperation===1 && "Agregar nuevo nivel a la estrategia"}
                {typeOperation===2 && "Actualizar nivel de la estrategia"}
              </p>
              <Input 
                  onType={setTargetLevel}
                  objectValue={targetLevel}
                  inputName={"role"}
                  placeholder={"Nombre de la posicion"}
                  inputType="text"
                  required={true} />
              {
                (targetLevel!==undefined && 
                  ((targetLevel?.zone_type!=="" && typeOperation===2) || typeOperation===1)) &&
                <Input 
                    onType={setTargetLevel}
                    objectValue={targetLevel}
                    inputName={"zone_type"}
                    placeholder={"Nombre del tipo de zona"}
                    inputType="text"
                    required={true} />
              }
            </>)
          }
          {typeOperation===3 &&
            (<>
              <p className="text-xl text-center mb-3">
                ¿Seguro que quieres 
                <span className="font-bold"> eliminar </span> 
                el siguiente nivel de la estrategia?
              </p>
              <p className="mb-3 text-lg">Nombre:
                <span className="ml-2 italic">{targetLevel?.role}</span>
              </p>
              <p className="mb-3 text-lg">Tipo de zona que administra: 
                <span className="ml-2 italic">
                {
                  targetLevel?.zone_type === "" ? "Este nivel no administra ningun tipo de zona":targetLevel?.zone_type
                }
                </span>
              </p>
              <p>
                Esta acción 
                <span className="font-bold"> puede tener graves repercuciones en la estructura actual, </span> como perdida
                de relaciones entre lider-seguidor o administrador-area geografica, etc.
              </p>
            </>)
          }
          <div className="flex flex-row justify-center">
            <Button label="Aceptar" onClick={handlePerfomOperation} />
            <Button 
              label="Cancelar" 
              onClick={handlerCancelOperation} 
              colorButton={1}/>
          </div>
        </div>
      </Dialog>
      {strategyLevels === undefined ?
        <div className="flex justify-center items-center h-full">
          <CircularProgress />
        </div> : 
        <>
          {
            strategyLevels.map(strategyLevel => 
            <div 
              key={strategyLevel.id_strategy} 
              className="flex flex-col justify-center">
              <div className="flex flex-row justify-center">
                <button 
                className="w-12 h-12 p-4 bg-sky-600 rounded-full flex justify-center hover:bg-sky-800"
                onClick={() => 
                  {handleInitializeOperation(strategyLevel, 1)}} 
                >
                  <FiPlus className="text-lg text-white"/>  
                </button>
              </div>
              <div 
                className="p-5 m-3 bg-white  rounded-lg flex flex-row items-center divide-x-2 divide-black">
                  <p className="basis-1/4 px-2 text-center">
                    {strategyLevel.role}
                  </p>
                  <p className="basis-1/4 px-2 text-center">
                    {
                      strategyLevel.zone_type === "" ? "No administra areas" : strategyLevel.zone_type
                    }
                  </p>
                  <button 
                    onClick={() => 
                      {handleInitializeOperation(strategyLevel, 2)}} 
                    className="basis-1/4 flex flex-row justify-center divide-x-2 divide-black">              
                    <MdEdit 
                      className="text-2xl text-sky-600 hover:text-sky-800 hover:cursor-pointer"/>
                  </button>
                  <button 
                    onClick={() => 
                      {handleInitializeOperation(strategyLevel, 3)}} 
                    className="basis-1/4 flex flex-row justify-center divide-x-2 divide-black">              
                    <BsFillTrashFill 
                      className="text-2xl text-red-600 hover:text-red-800
                      hover:cursor-pointer"/>
                  </button>
              </div>
            </div>
            )
          }
          <div className="flex flex-row justify-center">
            <button className="w-12 h-12 p-4 bg-sky-600 rounded-full flex justify-center hover:bg-sky-800"
              onClick={() => {
                if(strategyLevels !== undefined) {
                  if(strategyLevels[strategyLevels.length-1] === undefined) {
                    const referenceLevel:IStrategy = {
                      id_strategy: 0,
                      zone_type: "",
                      role: "",
                      cardinality_level: 1
                    }
                    handleInitializeOperation(referenceLevel, 1)
                  } else {
                    const referenceLevel:IStrategy = strategyLevels[strategyLevels.length-1];
                    referenceLevel.cardinality_level = referenceLevel.cardinality_level + 1;
                    handleInitializeOperation(referenceLevel, 1)
                  }
                }
              }}
            >
              <FiPlus className="text-lg text-white"/>  
            </button>
          </div>
        </> 
    }
    </div>
  )
}

export default StrategyForms;