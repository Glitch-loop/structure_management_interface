import { MdEdit } from "react-icons/md";
import { BsFillTrashFill } from "react-icons/bs";
import { useEffect, useState } from "react";
import { IStrategy, IRequest } from "../../interfaces/interfaces";
import requester from "../../helpers/Requester";
import { FiPlus } from "react-icons/fi"
import { Dialog } from "@mui/material";
import Button from "../UIcomponents/Button";
import Input from "../UIcomponents/Input";

const getStrategy = async():Promise<IStrategy[]> => {
  const response:IRequest<IStrategy[]> = await requester({
    url: `/strategyLevels`,
    method: 'GET'
  })
  if(response.data !== undefined) {
    return response.data
  } else return []
}


const deleteStrategyLevel = async(idStrategyLevel: number):Promise<IRequest<undefined>> => {
  const response:IRequest<undefined> = await requester({
    url: `/strategyLevels/${idStrategyLevel}`,
    method: 'DELETE'
  })

  return response;
}

const updateStrategyLevel = async(strategyLevel: IStrategy): Promise<IRequest<undefined>> => {
  const data = {
    roleName: strategyLevel.role,
    zoneType: strategyLevel.zone_type
  }
  const response:IRequest<undefined> = await requester({
    url: `/strategyLevels/${strategyLevel.id_strategy}`,
    method: 'PUT',
    data: data
  })

  return response;
}

const addStrategyLevel = async(strategyLevel: IStrategy): Promise<IRequest<undefined>> => {
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

  return response;
}

const StrategyForms = () => {
  const [strategyLevels, setStrategyLevels] = useState<IStrategy[]>([]);
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
  const [targetLevel, setTargetLevel] = useState<IStrategy|undefined>(undefined);

  useEffect(()=>{
    try {
      getStrategy().then((data) => setStrategyLevels(data))
    } catch (error) {
      console.log(error)
    }
  },[])

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
          console.log(await getStrategy())
          setStrategyLevels(await getStrategy())
        }
      } else if(typeOperation === 2) {
         response = await updateStrategyLevel(targetLevel);
         if(response?.code === 200) {
          const index:number = strategyLevels.findIndex(strategyLevel => strategyLevel.id_strategy === targetLevel.id_strategy);
          strategyLevels[index] = targetLevel
          setStrategyLevels(strategyLevels)
        }
      } else if(typeOperation === 3) {
        response = await deleteStrategyLevel(targetLevel.id_strategy);
        if(response?.code === 200) {
          setStrategyLevels(await getStrategy())
        }
      }
      console.log(response) 
    }
    setTypeOperation(0);
    setShowDialog(false);
    setTargetLevel(undefined);
  }

  const handleUpdateName = (e:string) => {
    if (targetLevel !== undefined) 
      setTargetLevel({...targetLevel, "role": e});
  }

  const handleUpdateZoneType = (e: string) => {
    if (targetLevel !== undefined) 
      setTargetLevel({...targetLevel, "zone_type": e});
  }

  return(
    <div className="w-10/12 h-5/6 p-5 bg-neutral-100 rounded-lg overflow-auto">
      <Dialog onClose={handleOnCloseDialog} open={showDialog}>
        <div className="p-5">
          {(typeOperation===1 || typeOperation===2) &&
            (<>
              <h1>
                {typeOperation===1 && "Agregar a la estrategia"}
                {typeOperation===2 && "Actualizar nivel de la estrategia"}
              </h1>
              <Input 
                  onType={(e:any) => {handleUpdateName(e)}}
                  inputValue={
                    targetLevel!==undefined ? targetLevel.role : ""
                  }
                  inputName={"Nombre de la posicion"}
                  inputType="text"
                  required={true} />
              {
                (targetLevel!==undefined && 
                  ((targetLevel?.zone_type!=="" && typeOperation===2) || typeOperation===1)) &&
                <Input 
                    onType={(e:any) => {handleUpdateZoneType(e)}}
                    inputValue={
                      targetLevel!==undefined ? targetLevel.zone_type : ""
                    }
                    inputName={"Nombre del tipo de zona"}
                    inputType="text"
                    required={true} />
              }
            </>)
          }
          {typeOperation===3 &&
            (<>
              <p>¿Seguro que quieres eliminar el siguiente nivel de la estrategia?</p>
              <p>Nombre: {targetLevel?.role}</p>
              <p>Tipo de zona que administra: 
                {
                  targetLevel?.role === "" ? "Este nivel no administra ningun tipo de zona":targetLevel?.role
                }
              </p>
              <p>
                Esta acción puede tener graves repercuciones en la estructura actual, como perdida
                de relaciones entre lider-seguidor o administrar-area geografica
              </p>
            </>)
          }
          <div className="flex flex-row justify-center">
            <Button label="Aceptar" onClick={handlePerfomOperation}/>
            <Button label="Cancelar" onClick={handlerCancelOperation}/>
          </div>
        </div>
      </Dialog>
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
          }
            >
          <FiPlus className="text-lg text-white"/>  
        </button>
      </div>
    </div>
  )
}

export default StrategyForms;