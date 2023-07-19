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
  const [storeTargetLevel, setStoreTargetLevel] = useState<IStrategy>(initialStrategyState);

  //Reducers for alerts message
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
          alertType: EAlert.warning, 
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

      console.log(response)
      if(response.message === "There is another level with the same name for the zone_type"
      && response.code === 400) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "No se pueden repetir los nombres de las 'zonas' entre los niveles de la estrategia"}}));
      }
      if(response.message === "There is another level with the same name for role_name"
      && response.code === 400) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "No se pueden repetir los nombres de los 'roles' entre los niveles de la estrategia"}}));
      }
      if(response.message === "The zone type name can't be grater than 60 characteres"
      && response.code === 400) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "El nombre de la zona no puede ser mas largo que 60 caracteres"}}));
      }
      if(response.message === "The role name can't be grater than 60 characteres"
      && response.code === 400) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "El nombre del nivel jerarquico no puede ser mas largo que 60 caracteres"}}));
      }

      if(response.code === 200) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.success, 
          message: "El nivel de la estrategia se ha actualizado exitosamente"}}));
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

      let messageSuccesfull = "Se ha agregado el nivel a la estrategia exitosamente";
      strategyLevel.zone_type !== "" ? 
        messageSuccesfull+=" (administra un tipo de zona)" : messageSuccesfull+=" (NO administra un tipo de zona)";

      if(response.code === 400 && response.message === "Repeating names for roles and zone types are not allowed.") {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "Se esta repetiendo el nombre del nivel jerárquico con otro nivel ya existente"}}));
      }
      if(response.code === 400 && response.message === "roleName can't be grater than 60 characteres") {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "El nombre del nivel jerarquico no puede ser mas largo que 60 caracteres"}}));
      }
      if(response.code === 400 && response.message === "zoneType can't be grater than 60 characteres") {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "El nombre de la zona no puede ser mas largo que 60 caracteres"}}));
      }
      if(response.code === 201) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.success, 
          message: messageSuccesfull}}));
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
    restartOperation();

  }


  const handleInitializeOperation = (strategyLevel: IStrategy, typeOperation: number):void => {
    /*
      This handler recive 2 params, the first one is to "specify the level of the strategy" (in other words,
      it is the data of the level becuase either it is going to be updated or deleted).
      The second params is to specify the type of operation:
      1 = add level
      2 = modify level
      3 = delete level
      
      At least for the case 1, it is stored in the state a initial strategy level (without define 
      nither the role nor zone type), the unique filed that is defined is the "cardinality_level" this is
      because the backend needs to know where the new level is goint to be.

    */
    if(typeOperation===1) {
      const newStrategyLevel:IStrategy = {
        id_strategy: 0,
        zone_type: "",
        role: "",
        cardinality_level: strategyLevel.cardinality_level
      }
      setTargetLevel(newStrategyLevel);
    } else {
      setTargetLevel(strategyLevel)
      setStoreTargetLevel(strategyLevel);
    };
    setTypeOperation(typeOperation);
    
    // At the end, show the dialog
    setShowDialog(true);
  }

  
  const handlerCancelOperation = ():void => {
    /*
      This function is to cancel the current operation.
      The state of the operation is set to 0 (none), and close the dialog
    */
    restartOperation();
  }

  const handlePerfomOperation = async():Promise<void> => {
    if(targetLevel !== undefined) {
      let response:IRequest<undefined>|undefined = undefined;
      if(typeOperation === 1) {
        //Verify that the role ins't empty
        if(targetLevel.role === "") {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "El nombre del nivel jerárquico (rol) no puede estar vacío"}})); 
          restartOperation();
          return;
        }

        /*
          Call to the function to add a new strategy level.
          If everything is fine, we call again to the API for the new 
          strategy levels
        */
        response = await addStrategyLevel(targetLevel);
        if(response?.code === 201) {
          setStrategyLevels(await getStrategy())
        }
      } else if(typeOperation === 2) {
        /*
          Call to the function to update a strategy level.
          If everything is fine, we call again to the API for the new 
          strategy levels
        */
        
        if(strategyLevels !== undefined) {
          const index:number = strategyLevels.findIndex(strategyLevel => strategyLevel.id_strategy === targetLevel.id_strategy);

          //Verify that the role ins't empty
          if(targetLevel.role === "") {
            dispatch(enqueueAlert({alertData: {
              alertType: EAlert.warning, 
              message: "El nombre del nivel jerárquico no puede no puede estar vacío"}})); 
            restartOperation();
            return;
          }

          //In case that the role manage a geographic area, then care that isn't empty
          if(strategyLevels[index].zone_type !== "") {
            if(targetLevel.zone_type === "") {
              dispatch(enqueueAlert({alertData: {
                alertType: EAlert.warning, 
                message: "El nombre del tipo de zona no puede estar vacío"}})); 
              restartOperation();
              return;
            }
          }

          //If there is any difference in the role or zone type name, then update
          if(targetLevel.role != strategyLevels[index].role 
          || targetLevel.zone_type != strategyLevels[index].zone_type) {
            response = await updateStrategyLevel(targetLevel);
  
            //If the update was success, then update in the state the changes.
            if(response?.code === 200) {
              strategyLevels[index] = targetLevel
              setStrategyLevels(strategyLevels)
            }
          } else {
            dispatch(enqueueAlert({alertData: {
              alertType: EAlert.info, 
              message: "No ha habido ningun cambio"}}));  
          }
        }
      } else if(typeOperation === 3) {
        /*
          Call to the function to delete a strategy level.
          If everything is fine, we call again to the API for the new 
          strategy levels
        */
        response = await deleteStrategyLevel(targetLevel.id_strategy);
        if(response?.code === 200) {
          setStrategyLevels(await getStrategy())
        }
      }
    }

    //At the end, restart the states
    restartOperation();
  }

  const restartOperation = ():void => {
    setShowDialog(false);
    // setTypeOperation(0);
    setTargetLevel(initialStrategyState);
    setStoreTargetLevel(initialStrategyState);
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
                  ((storeTargetLevel.zone_type!=="" && typeOperation===2) || typeOperation===1)) &&
                <Input 
                    onType={setTargetLevel}
                    objectValue={targetLevel}
                    inputName={"zone_type"}
                    placeholder={"Nombre del tipo de zona"}
                    inputType="text"
                    required={typeOperation===1 ? false : true} />
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