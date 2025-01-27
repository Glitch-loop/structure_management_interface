import { useEffect, useState, useRef } from "react";
import { flushSync } from "react-dom";
import Input from "../UIcomponents/Input";
import { Autocomplete, TextField, Switch } from "@mui/material";
import Button from "../UIcomponents/Button";
import { IColony, IGeographicArea, IMember, IRequest, IStrategy, IStructure, ISectional } from "../../interfaces/interfaces";
import requester from "../../helpers/Requester";
import Chip from "@mui/material/Chip";
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import moment from 'moment';
import MessageAlert from "../UIcomponents/MessageAlert";

//Initial states
const initialPersonState:IMember = {
  id_member: 0,
  first_name: "",
  last_name: "",
  street: "",
  ext_number: "", 
  int_number: "",
  cell_phone_number: "",
  ine: "",
  birthday: "",
  gender: 0,
  id_leader: 0,
  id_follower: [],
  id_colony: 0,
  id_strategy: 0,
  colony_name: "",
  postal_code: "",
  id_sectional: 0,
  sectional_name: ""
}

const initialStrategicInformationState:IStructure = {
  id_member: 0,
  first_name: "",
  last_name: "",
  id_strategy: 0,
  zone_type: "",
  role: "",
  cardinality_level: 0,
  id_leader: 0,
  first_name_leader: "",
  last_name_leader: "",
  followers: [],
  id_geographic_area: 0,
  geographic_area_name: ""  
}

const responseError:IRequest<undefined> = {
  message: "Internal error",
  data: undefined,
  code: 500
}

//Auxiliar functions
const avoidNull = (data: any, replace: any):any => {
  return data === null ? replace : data;
}

const filterSelectedFollowers = (arrayTofilter: IStructure[], currentFollowersSelected:IStructure[]|undefined):IStructure[] => {
  if(currentFollowersSelected !== undefined) {
    const filterFollowersSelected:IStructure[] = [];
        
    for(let i = 0; i < arrayTofilter.length; i++) {
      if(currentFollowersSelected.find(
          follower => follower.id_member === arrayTofilter[i].id_member) ===
          undefined
        ) filterFollowersSelected.push(arrayTofilter[i])
    }
  
    return filterFollowersSelected;
  } else return arrayTofilter;
}

const validBirthDay = (date:string):boolean => {
  let valideAge = false;
  if(date !== "") {
    let birthAge = moment(date).format("YYYY");
    let age = moment().diff(birthAge, "years");
    if(age >= 18 && age <= 110) valideAge =  true;
    else valideAge = false;
  } else valideAge = true;
  return valideAge;
}

//Auxiliar functions to show inputs
const showLeaderInputFunction = (idStrategy:number|undefined, arrayStrategyLevel:IStrategy[]):boolean => {

  if(idStrategy!==undefined && idStrategy!==null && arrayStrategyLevel[0]!==undefined) {
    const index:number = arrayStrategyLevel.findIndex(strategyLevel => strategyLevel.id_strategy === idStrategy)

    if(index !== -1) 
      if(arrayStrategyLevel[index].cardinality_level !== 1) return true  

    
  }  
  return false
}

const showFollowerInputFunction = (idStrategy:number|undefined, arrayStrategyLevel:IStrategy[]):boolean => {
  //Always "arrayStrategyLevel" will be ordered in ascending order according to "cardinality"
  //The order will be 1, 2, 3 (took the cardinality)
  if(idStrategy!==undefined && idStrategy!==null && arrayStrategyLevel[0]!==undefined) {
    const index:number = arrayStrategyLevel.findIndex(strategyLevel => strategyLevel.id_strategy === idStrategy)
    if(index !== -1)  
      if(arrayStrategyLevel[arrayStrategyLevel.length - 1].id_strategy !== idStrategy) return true
  }
  return false
}

const showGeographicAreaInputFunction = (idStrategy:number|undefined, arrayStrategyLevel:IStrategy[]):boolean => {
  if(idStrategy!==undefined && idStrategy!==null && arrayStrategyLevel[0]!==undefined) {
    const index:number = arrayStrategyLevel.findIndex(strategyLevel => strategyLevel.id_strategy == idStrategy);
    if(index !== -1)  
      if(arrayStrategyLevel[index].zone_type !== '') return true
  }
  return false
}

/*
  action props
  0 = add member
  1 = update member
*/

const FormPerson = (
  {
    label,
    action = 0,
    handleSubmit,
    initialPersonInformation = initialPersonState,
    initialStrategicInformation = initialStrategicInformationState,
  }: {
    label: string,
    action: number,
    handleSubmit?: any;
    initialPersonInformation?: IMember, 
    initialStrategicInformation?: IStructure, 
  }) => {
    //useState states ---
    //Privileges
    const [addStrategycInformationToMember, setAddStrategycInformationToMember] = useState<boolean>(false);
    const [updateStrategycInformationToMember, setUpdateStrategycInformationToMember] = useState<boolean>(false);

    //Common fileds
    const [person, setPerson] = useState<IMember>(initialPersonInformation);
    const [strategicInformationPerson, setStrategicInformationPerson] = useState<IStructure>(initialStrategicInformation);

    //Operational input 
    const [searchFollower, setSearchFollower] = useState<string>('');

    //States to save the results of the search
    const [arraySearchColony, setArraySearchColony] = useState<IColony[]>([]);
    const [arraySearchSectional, setArraySearchSectional] = useState<ISectional[]>([]);
    const [arrayStrategyLevel, setArrayStrategyLevel] = useState<IStrategy[]>([]);
    const [arrayLeader, setArrayLeader] = useState<IStructure[]>([]);
    const [arrayFollower, setArrayFollower] = useState<IStructure[]>([]);
    const [arrayGeographicArea, setArrayGeographicArea] = useState<IGeographicArea[]>([]);

    //Show data
    const [showLeaderInput, setShowLeaderInput] = useState<boolean>(false);
    const [showFollowerInput, setShowFollowerInput] = useState<boolean>(false);
    const [showGeographicArea, setShowGeographicArea] = useState<boolean>(false);

    // State to store image
    const [uploadStatus, setUploadStatus] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    // Refs
    const listFollowersRef = useRef<HTMLUListElement>(null); 

    //Reducers to alerts
    const dispatch:Dispatch<AnyAction> = useDispatch();
    const userData = useSelector((state: RootState) => state.userReducer);

    // useEffect procedure ---
    useEffect(() => {
      //Get privileges depending the action that the user is performing
      if(action === 0) {
        //Add new member case
        requester({url: '/privileges/user/[8]', method: "GET"})
        .then(response => {
          setAddStrategycInformationToMember(response.data.privilege);
        });
      } else if(action===1) {
        //Update member case
        requester({url: '/privileges/user/[7]', method: "GET"})
        .then(response => {
          setUpdateStrategycInformationToMember(response.data.privilege);
        });
      }


      //Get information for the form
      getStrategy().then((dataResponse) => {
        setArrayStrategyLevel(dataResponse)
        setShowLeaderInput(
          showLeaderInputFunction(strategicInformationPerson.id_strategy, dataResponse))
        setShowFollowerInput(
          showFollowerInputFunction(strategicInformationPerson.id_strategy, dataResponse))
        setShowGeographicArea(
          showGeographicAreaInputFunction(strategicInformationPerson.id_strategy, dataResponse))
      })
    
    }, [])


    //Calls to API
    //Endpoint for privilege
    

    //Enpoint for add and update member
    const getStrategy = async ():Promise<IStrategy[]> => {
      try {
        const strategy: IRequest<IStrategy[]> = await requester({
          url: `/strategyLevels`,
          method: 'GET'
        })
        
        if(strategy.code === 200) 
          if(strategy.data !== undefined) 
            return strategy.data;
          
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar obtener los niveles de la estrategia, intente mas tarde"}})); 
        return [];
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar conectar con el servidor, intente mas tarde"}})); 
        return [];
      }
    }

    const addNewMember = async (basicData: any, idLeader?: number, idFollowers?: IStructure[], idGeographicArea?: number):Promise<IRequest<any>> => {
      try {
        const response:IRequest<any> = await requester({
          url: '/members/', 
          method: "POST", 
          data: basicData})
          
        let responseStrategicInformation:IRequest<any> = response;
        if(response.code === 201) {

          /*Show a message that the user has been created successfully*/
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.success, 
            message: "Se ha creado el miembro exitosamente"}}));

          if(response.data !== undefined) {
            const idMember:number = response.data.idMember
            
            //Update member's leader
            if(idLeader !== undefined && idLeader !== 0) {
              const responseLeader:IRequest<any> = await updateLeader(idMember, idLeader);
              responseStrategicInformation.code = responseLeader.code;
            }
              
            //Update member's followers 
            if(idFollowers !== undefined && idFollowers[0] !== undefined) {
              const responseFollower:IRequest<any> = await updateFollowers(idMember, idFollowers);
              responseStrategicInformation.code = responseFollower.code;
            }
            
            //Update geographic area's manager
            if(idGeographicArea !== undefined && idGeographicArea !== 0) {
              const responseGeographicArea:IRequest<any> = await updateGeographicAreaManage(idMember, idGeographicArea);
              responseStrategicInformation.code = responseGeographicArea.code;
            }
          }

          /* Show this message in case that the strategic information has been set successfully */
          if(responseStrategicInformation.code === 200) {
            dispatch(enqueueAlert({alertData: {
              alertType: EAlert.success, 
              message: "Se ha registrado la información estrategica del miembro"}}));
          }

        } else {
          if(response.message === 'You are repeating the complete name, the cellphone OR the INE in the DB.') {
            dispatch(enqueueAlert({alertData: {
              alertType: EAlert.warning, 
              message: "El nombre, celular o INE, del miembro que estas intentando agregar, coincide con el de otros miembro ya existentes"}}));
          } else {
            dispatch(enqueueAlert({alertData: {
              alertType: EAlert.warning, 
              message: "Hubo un error al intentar crear el nuevo miembro"}}));
          }
        }

        if(responseStrategicInformation.code !== 200)
          response.code = responseStrategicInformation.code;

        return response;
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar conectar con el servidor"}}));
        return responseError;
      }
    }

    const updateMember = async (basicData: any, idStrategy?: number, idLeader?: number, idFollowers?: IStructure[], idGeographicArea?: number):Promise<IRequest<any>> => {
      try {
        let response:IRequest<undefined> = responseError;
        let responseStrategicInformation:IRequest<undefined> = {
          code: 200,
          message: ""
        };

        if(basicData.idMember !== undefined) {

          const idMember:number = basicData.idMember;
          response = {
            code: 200,
            message: ""
          };

          //Update basic member's information 
          if(
            basicData.firstName !== initialPersonInformation.first_name ||
            basicData.lastName !== initialPersonInformation.last_name ||
            basicData.street !== initialPersonInformation.street ||
            basicData.extNumber !== initialPersonInformation.ext_number ||
            basicData.intNumber !== initialPersonInformation.int_number ||
            basicData.cellphoneNumber !== initialPersonInformation.cell_phone_number ||
            basicData.idColony !== initialPersonInformation.id_colony ||
            basicData.ine !== initialPersonInformation.ine ||
            basicData.birthday !== initialPersonInformation.birthday ||
            basicData.gender !== initialPersonInformation.gender ||
            basicData.idSectional !== initialPersonInformation.id_sectional
          ) {
            response = await requester({
              url: `/members/${idMember}`,
              method: "PUT",
              data: basicData
            })
          } 
          /* Answers for the responses for basic information */
          if(response.code === 200) {
            dispatch(enqueueAlert({alertData: {
              alertType: EAlert.success, 
              message: "Se ha actualizado el miembro exitosamente"}}));
          } 

          let genericError = true;
          if(response.message === "The data that you are trying to put it is repated with another member (full name, cellphone number or ine)" && response.code === 400) {
            genericError = false;
            dispatch(enqueueAlert({alertData: {
              alertType: EAlert.warning, 
              message: "Algun dato: 'nombre completo', 'INE' o 'numero de telefono', coincide con el de algun otro miembro de la estructura"}}));
          } 
          
          if(response.code === 400 && genericError){
            dispatch(enqueueAlert({alertData: {
              alertType: EAlert.warning, 
              message: "Ha habido un error al momento de actualizar el miembro"}}));
          }

          //Update member's strategy level
          if (idStrategy !== undefined && idStrategy !== 0)
            if(initialStrategicInformation.id_strategy !== idStrategy)
            responseStrategicInformation = await updateStrategyLevel(idMember, idStrategy)
            
          //Update member's leader
          if (idLeader !== undefined && idLeader !== 0) {
            //Update the current member's leader
            if(initialStrategicInformation.id_leader !== idLeader)
            responseStrategicInformation = await updateLeader(idMember, idLeader)
          } else {
            //Delete the current leader from the member
            responseStrategicInformation = await deleteLeader(idMember);
          }
            
      
          //Update member's followers 
          if(idFollowers !== undefined && idFollowers[0] !== undefined) 
            responseStrategicInformation = await updateFollowers(idMember, idFollowers)
          

          //Update geographic area's manager
          if (idGeographicArea !== undefined && idGeographicArea !== 0) {
            //Update the current member's geographic area
            if(initialStrategicInformation.id_geographic_area !== idGeographicArea)
            responseStrategicInformation = await updateGeographicAreaManage(idMember, idGeographicArea);
          } else {
            //Delete the current member's geographic area
            responseStrategicInformation = await deleteGeographicArea(idMember);
          }
          
          /* Massage in case for everything fine in strategic information */
          if(responseStrategicInformation.code === 200) {
            dispatch(enqueueAlert({alertData: {
              alertType: EAlert.success, 
              message: "Se ha actualizado la información del miembro"}}));
          }
        }

        if(responseStrategicInformation.code !== 200) {
          response = responseStrategicInformation;
        }

        return response 
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar conectar con el servidor"}}));
        return responseError;
      }
    }

    const updateStrategyLevel = async (idMember: number, idStrategy: number):Promise<IRequest<any>> => {
      try {
        const response:IRequest<undefined> = await requester({
          url: `/members/strategicInformation/strategyLevel/${idMember}/${idStrategy}`,
          method: 'PUT'
        });

        if(response.code !== 200) {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "Hubo un error al intentar actualizar el nivel jerárquico del miembro"}})); 
        }
        
        return response;
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar conectar con el servidor"}})); 
        return responseError
      }
    }

    const updateLeader = async (idMember: number, idLeader: number):Promise<IRequest<any>> => {
      try {
        const response:IRequest<any> = await requester({
          url: `/members/strategicInformation/leader/${idMember}/${idLeader}`,
          method: 'PUT'
        });

        if(response.code !== 200) {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "Hubo un error al intentar actualizar el lider del miembro"}})); 
        }

        return response;
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar conectar con el servidor"}}));         
        return responseError;
      }
    }

    const updateFollowers = async (idMember: number, idFollowers: IStructure[]):Promise<IRequest<any>> => {
      try {
        let response:IRequest<any> = responseError;
        if(idFollowers[0] !== undefined) {
          const followers: number[] = [];
          idFollowers.forEach(follower => followers.push(follower.id_member));
          response = await requester({
            url: `/members/strategicInformation/followers/${idMember}`,
            method: 'PUT',
            data: { followers }
          })

          if(response.code !== 200 ) {
            dispatch(enqueueAlert({alertData: {
              alertType: EAlert.warning, 
              message: "Hubo un error al intentar actualizar a los seguidores del miembro"}})); 
          }
        }

        return response
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar conectar con el servidor"}}));  
        return responseError;
      }
    }

    const updateGeographicAreaManage = async(idMember: number, idGeographicArea: number):Promise<IRequest<any>> => {
      try {
        const response:IRequest<undefined> = await requester({
          url: `/geographicAreas/strategicInformation/manager/${idGeographicArea}/${idMember}`,
          method: 'PUT'
        })
        if(response.code !== 200) {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "Hubo un error al intentar actualizar el area geografica de administra el miembro"}})); 
        }
      
        return response;
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar conectar con el servidor"}}));  
        return responseError;
      }
    }

    const deleteLeader = async (idMember: number):Promise<IRequest<any>> => {
      try {
        const response:IRequest<any> = await requester({
          url: `/members/strategicInformation/leader/${idMember}`,
          method: 'DELETE'
        })
  
        if(response.code !== 200) {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "No se ha podido eliminar el lider del miembro, intente nuevamente"}}));
        }

        return response;
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar conectarse al servidor"}}));
        return responseError;
      }
    }

    const deleteGeographicArea = async (idMember: number):Promise<IRequest<any>> => {
      try {
        const response:IRequest<any> = await requester({
          url: `/members/strategicInformation/geographicArea/${idMember}`,
          method: 'DELETE'
        })
  
        if(response.code !== 200) {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "No se ha podido eliminar el area geográfica del miembro, intente nuevamente"}}));
        }

        return response;
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar conectarse al servidor"}}));
        return responseError;
      }
    }

    const searchColonies = async (colonyToSearch: string):Promise<IColony[]> => {
      try {
        const response: IRequest<IColony[]> = await requester({
          url: `/colonies/name/${colonyToSearch}`,
          method: 'GET',
        })
        if(response.code === 200) {
          if(response.data !== undefined) return response.data;
        } else {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.error, 
            message: "Hubo un error al intentar buscar las colonias, intente mas tarde"}})); 
        }
        return [];
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar buscar las colonias, intente mas tarde"}}));
        return [];
      }
    }

    const searchColoniesApproximately = async (colonyToSearch: string):Promise<IColony[]> => {
      try {
        const response: IRequest<IColony[]> = await requester({
          url: `/colonies/name/approximate/${colonyToSearch}`,
          method: 'GET',
        })
        if(response.code === 200) {
          if(response.data !== undefined) return response.data;
        } else {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.error, 
            message: "Hubo un error al intentar buscar las colonias, intente mas tarde"}})); 
        }
        return [];
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar buscar las colonias, intente mas tarde"}}));
        return [];
      }
    }

    const searchSectionals = async (sectionalToSearch: string):Promise<ISectional[]> => {
      try {
        const response: IRequest<ISectional[]> = await requester({
          url: `/sectionals/name/${sectionalToSearch}`,
          method: 'GET',
        })
        if(response.code === 200) {
          if(response.data !== undefined) return response.data;
        } else {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.error, 
            message: "Hubo un error al intentar buscar las colonias, intente mas tarde"}})); 
        }
        return [];
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar buscar las colonias, intente mas tarde"}}));
        return [];
      }
    }

    const searchLeaderByNameAndStrategyLevel = async (idStrategy: number, leaderName:string):Promise<IStructure[]> => {
      try {
        const response: IRequest<IStructure[]> = await requester({
          url: `/members/strategicInformation/leaders/${idStrategy}/${leaderName}`,
          method: `GET`
        }) 

        if(response.code===200) 
          if(response.data !== undefined) 
            return response.data;
          
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar buscar los lideres, intente mas tarde"}}));

        return [];
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar buscar los lideres, intente mas tarde"}})) ;
        return [];
      }
    }

    const searchGeographicAreasByNameAndStrategyLevel = async (idStrategy: number, geographicAreaName:string):Promise<IGeographicArea[]> => {
      try {
        const response: IRequest<IGeographicArea[]> = await requester({
          url: `/geographicAreas/strategicInformation/${idStrategy}/${geographicAreaName}`,
          method: `GET`
        }) 
        if(response.code===200) 
          if(response.data !== undefined) 
            return response.data;
        
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar buscar las area geograficas, intente mas tarde"}})); 
        return [];
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar buscar las area geograficas, intente mas tarde"}})); 
        return [];
      }
    }

    const searchFollowerByNameAndStrategicLevel = async (idStrategy:number, newInputValue: string):Promise<IStructure[]> => {
      try {    
        const response: IRequest<IStructure[]> = await requester({
          url: `/members/strategicInformation/followers/${idStrategy}/${newInputValue}`,
          method: `GET`
        }) 
      
        if(response.code === 200) 
          if(response.data !== undefined) 
            return response.data;
        
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar buscar los seguidores, intente mas tarde"}})); 
        return [];
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar buscar los seguidores, intente mas tarde"}})); 
        return [];
      }
    }

    const extratInformationFromImage = async (encodedImage:any):Promise<IMember> => {
      try {    
        const response: IRequest<IMember> = await requester({
          url: `/members/information/image`,
          method: `POST`,
          data: {image: encodedImage}
        }) 
      
        if(response.code === 200) 
          if(response.data !== undefined) 
            return response.data;
        
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar analizar la image"}})); 
        return initialPersonState;
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar analizar la image"}})); 
        return initialPersonState;
      }
    }

    //Handlers basic information ---
    //Handlers for colony autocomplete
    const handleSearchColony = async (event: any, newInputValue: string | null) => {
      if(newInputValue !== null) {
        //Save the current user's search
        setPerson({...person, colony_name: newInputValue}) 
        //If the user doesn't search anything, delete the current results 
        if(newInputValue==='') setArraySearchColony([]) 

        /*
          If the array of results is empty and the user is searcher something, 
          make a request to backend to search what the user is searching.
        */
        if(arraySearchColony[0] === undefined && newInputValue !== '') 
          setArraySearchColony(await searchColonies(newInputValue))        
      }
    }

    const handleSelectColony = async (event: any, newInputValue: string | null) => {
      // Search through the name, the colony that the user selected
      const colonySelected:IColony|undefined = arraySearchColony
      .find(searchColony => searchColony.name_colony === newInputValue);

      /*
        If the colony wasn't founded, reset the fields in the state, otherwise
        save the ID and name of the colony selected
      */
      if(colonySelected===undefined) setPerson({...person, id_colony: 0, colony_name: ""});
      else 
        setPerson({
          ...person, 
          id_colony: colonySelected.id_colony, 
          colony_name: colonySelected.name_colony});
    }

    //Handlers for sectional autocomplete
    const handleSearchSectional = async (event: any, newInputValue: string | null) => {
      if(newInputValue !== null) {
        //Save the current user's search
        setPerson({...person, sectional_name: newInputValue}) 
        //If the user doesn't search anything, delete the current results 
        if(newInputValue==='') setArraySearchSectional([]) 

        /*
          If the array of results is empty and the user is searcher something, 
          make a request to backend to search what the user is searching.
        */
        if(arraySearchSectional[0] === undefined && newInputValue !== '') 
          setArraySearchSectional(await searchSectionals(newInputValue))        
      }
    }

    const handleSelectSectional = async (event: any, newInputValue: string | null) => {
      // Search through the name, the colony that the user selected
      const sectionalSelected:ISectional|undefined = arraySearchSectional
      .find(searchSectional => searchSectional.sectional_name === newInputValue);

      /*
        If the colony wasn't founded, reset the fields in the state, otherwise
        save the ID and name of the colony selected
      */
      if(sectionalSelected===undefined) setPerson({...person, id_sectional: 0, sectional_name: ""});
      else {
        setPerson({
          ...person, 
          id_sectional: sectionalSelected.id_sectional, 
          sectional_name: sectionalSelected.sectional_name});
      }
    }

    const handleChangeGender = (e:any) => {
      if(person.gender == 0) setPerson({...person, gender: 1})
      else setPerson({...person, gender: 0})
    }

    //Handlers strategic information --- 
    //Handlers for strategic level autocomplete
    const handleSearchStrategyLevel = async (event: any, newInputValue: string | null) => {
      if (newInputValue !== null) {
        //Save the current search of the user
        setStrategicInformationPerson({...strategicInformationPerson, role: newInputValue});
        
        //If the user delete the input (in other words the input is empty), restart the states
        if(newInputValue === "") {
          setShowFollowerInput(false);
          setShowLeaderInput(false);
          setShowGeographicArea(false);

          /*
            If the user delete the strategic level, it's necessary to delete the current 
            member's strategic information
          */
          setStrategicInformationPerson({
            ...strategicInformationPerson,
            role: "",
            id_strategy: 0,
            first_name_leader: "",
            id_leader: 0,
            geographic_area_name: "",
            id_geographic_area: 0,
            followers: []
          })
        }
      }
    }
    
    const handleSelectStrategyLevel = async (event: any, newValue: string | null) => {
      /*
        Find the strategic level by role, comparing with the user's value selected 
      */
      const strategyLevelSelected: IStrategy|undefined = 
      arrayStrategyLevel.find(strategyLevel => strategyLevel.role === newValue);
      /*
        If the strategic level is not founded, reset the state, otherwise, check which inputs
        show of the strategic information
      */
      if(strategyLevelSelected===undefined || strategyLevelSelected===null) 
        setStrategicInformationPerson({
          ...strategicInformationPerson, 
          role: "",
          id_strategy: 0,
          first_name_leader: "",
          id_leader: 0,
          geographic_area_name: "",
          id_geographic_area: 0,
          followers: []
        });
      else { 
        setStrategicInformationPerson({
          ...strategicInformationPerson, 
          id_strategy: strategyLevelSelected.id_strategy,
          role: strategyLevelSelected.role,
          //If there is a change of level, it's necessary to delete all the current strategic data
          first_name_leader: "",
          id_leader: 0,
          geographic_area_name: "",
          id_geographic_area: 0,
          followers: []
        });
        setShowFollowerInput(
          showFollowerInputFunction(strategyLevelSelected.id_strategy, arrayStrategyLevel));
        setShowLeaderInput(
          showLeaderInputFunction(strategyLevelSelected.id_strategy, arrayStrategyLevel));
        setShowGeographicArea(
          showGeographicAreaInputFunction(strategyLevelSelected.id_strategy, arrayStrategyLevel));

      }
    }

    //Handlers for leader autocomplete
    const handleSearchLeader = async (event: any, newInputValue: string | null) => {
      if(newInputValue !== null) {
        //Save the current user's search input
        setStrategicInformationPerson({
          ...strategicInformationPerson, 
          first_name_leader: newInputValue
        });
        if(strategicInformationPerson.id_strategy !== undefined) {
          /*
           If the user's input is empty, then delete the current leader's store values.
           There isn't what the user is try to find
          */
          if(newInputValue==='') setArrayLeader([]);

          // If the leader's array is empty and the user's input is different to empty, request data to API
          if(arrayLeader[0] === undefined && newInputValue !== '') {
            setArrayLeader(
              await searchLeaderByNameAndStrategyLevel(
                strategicInformationPerson.id_strategy, newInputValue));
          }
        }
      }
    }

    const handleSelectLeader = async (event: any, newInputValue: string | null) => {
      /*
        Find by full name the leader in the current data saved in arrayLeader
      */
      const leaderSelected: IStructure|undefined = 
      arrayLeader.find(leader => `${leader.first_name} ${leader.last_name}` === newInputValue);

      /*
        If the leader wasn't founded, then reset the state, otherwise, save the state
      */
      if(leaderSelected === undefined || newInputValue === null) {
        setStrategicInformationPerson({
          ...strategicInformationPerson, 
          first_name_leader: "",
          id_leader: 0});
      } else {
        setStrategicInformationPerson({
          ...strategicInformationPerson, 
          first_name_leader: newInputValue,
          id_leader: leaderSelected.id_member});
      
      }
      //Reset the array of leader (the leader already was founded)
      setArrayLeader([]);
    }

    //Handlers for leader autocomplete
    const handleSearchFollowers = async (event: any, newInputValue: string | null) => {
      if(newInputValue!== null) {
        setSearchFollower(newInputValue);
        if(strategicInformationPerson.id_strategy !== undefined) {
          if(newInputValue==='') setArrayFollower([]); //If the input is '' empty the array
          /*If the user is searching a follower, and there is still empty the array, ask 
          to the API, other
          */
          if(arrayFollower[0] === undefined && newInputValue !== '') {
            setArrayFollower(
              await searchFollowerByNameAndStrategicLevel(
                strategicInformationPerson.id_strategy, newInputValue))
          }
        }
      }
    }

    const handleSelectFollower = async(event:any, newInputValue: string | null) => {
      //Restart the state (user found the follower that he wanted to find)
      setSearchFollower('');
      
      //Find the follower through the full name
      const follower:IStructure|undefined = arrayFollower
      .find(follower => newInputValue === `${follower.first_name} ${follower.last_name}`);

      /*
        If the follower is founded, then add that follower to the current followers that 
        has the member
      */
      if(follower !== undefined){
        const currentFollower:IStructure[]|undefined = strategicInformationPerson.followers;
        if(currentFollower !== undefined) {
          currentFollower.push(follower);
          flushSync(() => {
            setStrategicInformationPerson({
              ...strategicInformationPerson,
              followers: currentFollower
            })
          });
          (listFollowersRef.current!.lastChild as HTMLElement).scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          })

        }
      } 
    }

    const handleDeleteFollower = (e: IStructure):void => { 
      //Get the current followers stored
      const currentFollowers:IStructure[]|undefined = strategicInformationPerson.followers;
      
      if(currentFollowers !== undefined) {
        //Save the new array without the follower that the user want to delete  
        setStrategicInformationPerson({
          ...strategicInformationPerson,
          followers: currentFollowers.filter(follower => follower.id_member !== e.id_member)
        })
      }
    }

    //Handlers for geographic area autocomplete
    const handleSearchGeographicArea = async (event: any, newInputValue: string | null) => {

      if(newInputValue !== null) {
        //Save the current user's search 
        setStrategicInformationPerson({
          ...strategicInformationPerson, 
          geographic_area_name: newInputValue
        });
        if(strategicInformationPerson.id_strategy !== undefined) {
          /*
           If the user's input is empty, then delete the current geographic areas' stored values.
           There isn't what the user is try to find
          */
          if(newInputValue==='') setArrayGeographicArea([]);
          // If the geographic's array is empty and the user's input is different to empty, request data to API
          if(arrayGeographicArea[0] === undefined && newInputValue !== '') {
            
             setArrayGeographicArea(
              await searchGeographicAreasByNameAndStrategyLevel(
                strategicInformationPerson.id_strategy, newInputValue));
          }
        }
      }
    }

    const handleSelectGeographicArea = async (event: any, newInputValue: string | null) => {
      /*
        Find by geographic area name (and its ID) the geographic area 
        in the current data saved in arrayLeader
      */
      const geographicAreaSelected: IGeographicArea|undefined = 
      arrayGeographicArea.find(geographicArea => `${geographicArea.geographic_area_name} - ${geographicArea.id_geographic_area}` === newInputValue);
      /*
        If the geographic are wasn't founded, then reset the state, otherwise, save the state
      */
      if(geographicAreaSelected === undefined || newInputValue === null) 
        setStrategicInformationPerson({
          ...strategicInformationPerson, 
          geographic_area_name: "",
          id_geographic_area: 0})
      else 
        setStrategicInformationPerson({
          ...strategicInformationPerson, 
          geographic_area_name: `${geographicAreaSelected.geographic_area_name} - ${geographicAreaSelected.id_geographic_area}`,
          id_geographic_area: geographicAreaSelected.id_geographic_area})
      
      setArrayGeographicArea([]);
    }

    //Handle to submit ---
    const handleOnSubmit = async(e: any) => {
      e.preventDefault();
      if(
        person.first_name === '' ||
        person.last_name === '' ||
        person.street === '' ||
        person.ext_number === '' ||
        person.cell_phone_number === '' ||
        person.ine === ''
        ){
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "Llena todos los campos obligatorios"}}));
          return;
      }
      if(person.id_colony === 0){
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "Haz olvidado escoger la colonia donde vive el miembro"}}));
          return;
      }
      if(person.id_sectional === 0){
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "Haz olvidado escoger el seccional a donde pertenece el miembro"}}));
          return;
      }
      if(strategicInformationPerson.id_strategy === 0){
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "Haz olvidado esocger un nivel jerarquico para el miembro"}}));
          return;
      }

      e.preventDefault();
      const basicData = {
        "idMember": avoidNull(person.id_member, 0),
        "firstName": avoidNull(person.first_name, ""),
        "lastName": avoidNull(person.last_name, ""),
        "street": avoidNull(person.street, ""),
        "extNumber": avoidNull(person.ext_number, ""),
        "intNumber": avoidNull(person.int_number, ""),
        "cellphoneNumber": avoidNull(person.cell_phone_number, ""),
        "ine": avoidNull(person.ine, ""),
        "birthday": avoidNull(person.birthday, ""),
        "gender": avoidNull(person.gender, 0),
        "idColony": avoidNull(person.id_colony, 0),
        "idSectional": avoidNull(person.id_sectional, 0),
        "idStrategyLevel": avoidNull(strategicInformationPerson.id_strategy, 0)
      }

        let response:IRequest<any> = responseError;
        if(action==0) {
          response = await addNewMember(
            basicData, 
            strategicInformationPerson.id_leader, 
            strategicInformationPerson.followers, 
            strategicInformationPerson.id_geographic_area);
        } else if(action==1) {
          response = await updateMember(
            basicData, 
            strategicInformationPerson.id_strategy, 
            strategicInformationPerson.id_leader, 
            strategicInformationPerson.followers, 
            strategicInformationPerson.id_geographic_area);
          
          if(response.code === 200) handleSubmit(true);
        }

         if(response.code === 201 || response.code === 200){
          //Reset variables
          resetAllStates()
        }
    }

    //Handle upload an image
    const handleUpload = async () => {
      console.log(selectedFile)
      if (!selectedFile) {
        setUploadStatus('Please select a file first.');
        return;
      }

      try {
        // Converting image into Base64
        const base64Image = await convertToBase64(selectedFile);
        //console.log(base64Image)
        // Calling API
        const item = await extratInformationFromImage(base64Image);
        
        // Calling API for complex fields
        const sectional:ISectional[] = await searchSectionals(item.sectional_name);
        const colony:IColony[] = await searchColoniesApproximately(item.colony_name);

        if(sectional[0] != undefined) {
          item.id_sectional = sectional[0].id_sectional;
        }
        
        if(colony[0] != undefined) {
          item.id_colony = colony[0].id_colony;
          item.colony_name = colony[0].name_colony;
        }
        

        console.log(item);
        
        setPerson(item)
        setSelectedFile(null);
      } catch (error) {
        setSelectedFile(null);
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar analizar la image"}})); 
      }


    }

    const handleFileChange = (event:any) => {
      const file = event.target.files[0];
      setSelectedFile(event.target.files[0]);

    };

    //Auxiliar functions
    const resetAllStates = ():void => {
      //Basic information states related
      setPerson(initialPersonState);

      //Strategic information states related
      setStrategicInformationPerson(initialStrategicInformationState);
      
      //Autocomplete store data states related
      setArraySearchColony([])
      setArrayLeader([])
      setArrayGeographicArea([])
      
      setArrayFollower([])
      setSearchFollower('')
    }

    const convertToBase64 = (file:any) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    };



  return (
    <div className="flex flex-row">
      <div>
        <div className="text-center text-xl font-bold">
          {label}
        </div>
        <form>
          {/* Basic information */}
          <div className="flex flex-row">
            <div className="mr-3">
              <p className="text-md text-center">
                Información basica
              </p>
              <div className="flex flex-row justify-center">
                <div className="mr-2">
                  <Input
                    onType={setPerson}

                    objectValue={person} 
                    inputName={"first_name"}
                    placeholder={'Nombre(s)'}
                    inputType={'text'}
                    required={true}
                  />
                </div>
                <Input
                  onType={setPerson}
                  objectValue={person} 
                  inputName={"last_name"}
                  placeholder={'Apellidos'}
                  inputType={'text'}
                  required={true}
                />
              </div>
              <div className="flex flex-row justify-center">
                <Input
                  onType={setPerson}
                  objectValue={person} 
                  inputName={"street"}
                  placeholder={'Calle'}
                  inputType={'text'}
                  required={true}
                />
              </div>
              <div className="flex flex-row justify-center">
                <div className="mr-2">
                  <Input
                    onType={setPerson}
                    objectValue={person} 
                    inputName={"ext_number"}
                    placeholder={'No. Exterior'}
                    inputType={'text'}
                    required={true}
                    testRegex={new RegExp(/^.{1,5}$/, 's')}
                    testMessage={"EL numero exterior no puede ser mayor a 5 caracteres"}
                  />
                </div>
                <Input
                  onType={setPerson}
                  objectValue={person} 
                  inputName={"int_number"}
                  placeholder={'No. Interno (opcional)'}
                  inputType={'text'}
                  testRegex={new RegExp(/^.{1,5}$/, 's')}
                  testMessage={"EL numero interior no puede ser mayor a 5 caracteres"}
                />
              </div>
              <div className="flex mt-3 justify-center">
                <Autocomplete
                  disablePortal
                  id="combo-box-demo"
                  onInputChange={(event: any, newInputValue: string | null) => 
                    handleSearchColony(event, newInputValue) }
                  onChange={(event: any, newValue: any) => handleSelectColony(event, newValue) }
                  value={person.colony_name}
                  options={ 
                    arraySearchColony.map((searchColony => searchColony.name_colony)) 
                  }
                  sx={{ width: 300 }}
                  renderInput={(params) => <TextField {...params} label="Colonia" />}
                  />
              </div>
              <div className="flex flex-row justify-center">
                <div className="mr-2">
                  <Input
                      onType={setPerson}
                      objectValue={person} 
                      inputName={"cell_phone_number"}
                      placeholder={'Telefono'}
                      inputType={'text'}
                      required={true}
                      testRegex={new RegExp(/(^\d{2}\-\d{4}\-\d{4}$)|(^\d{3}\-\d{3}\-\d{4}$)/, 's')}
                      testMessage={"Formatos validos: xx-xxxx-xxxx or xxx-xxx-xxxx"}
                    />
                </div>
                <Input
                  onType={setPerson}
                  objectValue={person} 
                  inputName={"ine"}
                  placeholder={'INE'}
                  inputType={'text'}
                  required={true}
                  testRegex={new RegExp(/^\d{13}$/, 's')}
                  testMessage={"Tienen que ser 13 numeros exactos"}
                  />
              </div>
              <div className="flex mt-3 justify-center">
                <Autocomplete
                  disablePortal
                  id="selection-sectional-member"
                  onInputChange={(event: any, newInputValue: string | null) => 
                    handleSearchSectional(event, newInputValue) }
                  onChange={(event: any, newValue: any) => 
                    handleSelectSectional(event, newValue) }
                  value={person.sectional_name}
                  options={ 
                    arraySearchSectional.map((searchSectionals => searchSectionals.sectional_name)) 
                  }
                  sx={{ width: 300 }}
                  renderInput={(params) => <TextField {...params} label="Seccional" />}
                  />
              </div>
              <div className="flex flex-row mt-1">
                <div className="mr-2 flex flex-col basis-1/2">
                <Input
                  onType={setPerson}
                  objectValue={person} 
                  inputName={"birthday"}
                  placeholder={'Fecha de nacimiento'}
                  inputType={'date'}
                  required={true}
                  />
                  {validBirthDay(person.birthday) === false && 
                    <MessageAlert label="Fecha de nacimiento invalida, el miembro debe de ser mayor de edad" />
                  }
                </div>
                <div className="mt-5 flex basis-1/2 items-center justify-center">
                  <p>Genero: </p>
                  <Switch 
                    checked={person.gender === 0 ? false : true}
                    onChange={handleChangeGender}/>
                  <p>{person.gender === 0 ? "Hombre" : "Mujer"}</p>
                </div>
              </div>
            </div>
            {/* Strategic information */}
              {
                /*
                  Verify if the user has privileges enoguh.

                  In the first case "action===0", if the user can add a member, then he can
                  choose the strategy level for the new member, we verified this privileges in previous steps (in the layout for this view)... Strategy level is considerated 
                  as strategic information, but it is necessary at the moment of add a new member.

                  For the second case "action===1", refers if the memeber has privileges to update
                  strategic information of a member that already exists. 
                */
                (action === 0 || (action === 1 && updateStrategycInformationToMember===true)) &&
                <div className="mt-3">
                  <p className="text-md">Información estrategica</p>
                  <div className="flex flex-col">
                    {/* Heirarchical level */}
                    <div className="flex mt-3 justify-center">
                      <Autocomplete
                        disablePortal
                        id="input-strategy"
                        onInputChange={(event: any, newInputValue: string | null) => 
                          { handleSearchStrategyLevel(event, newInputValue) }}
                        onChange={(event: any, newValue: string | null) => 
                          handleSelectStrategyLevel(event, newValue) }
                        value={ strategicInformationPerson.role }
                        options={ arrayStrategyLevel.map((strategyLevel => strategyLevel.role)) }
                        sx={{ width: 300 }}
                        renderInput={(params) => <TextField {...params} label="Nivel jerarquico" />}
                        />
                    </div>
                    {
                      /*
                        This if is to validate if the member has privileges to set strategic 
                        information at the moment to add a new members.

                        For the first part of the if "action===1", we just verified in the previous
                        "if" if the user has the privileges, so we only verify the "scenario" 
                        (update a member) 
                      */
                    (action === 1 || (addStrategycInformationToMember===true && action===0)) &&
                    <>
                      {/* Input leader */}
                      {
                        (showLeaderInput) &&                  
                        <div className="flex mt-3 justify-center">
                          <Autocomplete
                            disablePortal
                            id="input-leader"
                            onInputChange={(event: any, newInputValue: string | null) => 
                              { handleSearchLeader(event, newInputValue) }}
                            onChange={(event: any, newValue: string | null) => {
                              handleSelectLeader(event, newValue)
                            }}
                            options={arrayLeader.map(leader => `${leader.first_name} ${leader.last_name}`)}
                            value={ strategicInformationPerson.first_name_leader }
                            sx={{ width: 300 }}
                            renderInput={(params) => <TextField {...params} label="Lider" />}
                            />
                        </div>
                      }
                      {/* Follower input */}
                      {
                        (showFollowerInput) && 
                        <>
                          <div className="flex mt-3 justify-center">
                            <Autocomplete
                              disablePortal
                              id="input-follower"
                              onInputChange={(event: any, newInputValue: string | null) => 
                                handleSearchFollowers(event, newInputValue) }
                              onChange={(event:any, newInputValue: string | null) => 
                                handleSelectFollower(event,newInputValue)}
                              options={ 
                                filterSelectedFollowers(
                                  arrayFollower, 
                                  strategicInformationPerson.followers)
                                .map(follower => 
                                  `${follower.first_name} ${follower.last_name}`)
                              }
                              sx={{ width: 300 }}
                              value={searchFollower}
                              renderInput={(params) => <TextField {...params} label="Seguidores" />}
                              />
                          </div>
                          {
                            strategicInformationPerson.followers !== undefined  &&
                              strategicInformationPerson.followers[0] !== undefined &&
                                <div className="my-2 overflow-y-auto max-h-32 flex justify-center outline outline-2">
                                  <div className="w-52 py-1 flex flex-wrap justify-center">
                                    {
                                      strategicInformationPerson.followers.map((follower) => 
                                        <ul key={follower.id_member} className="my-1" ref={listFollowersRef}>
                                          <Chip 
                                            label={`${follower.first_name} ${follower.last_name}`} 
                                            onDelete={() => handleDeleteFollower(follower)}
                                            />
                                        </ul>
                                      )
                                    }                          
                                  </div>
                                </div>
                          }
                        </>
                      }
                      
                      {/* Geographic area  */}
                      {
                        (showGeographicArea) &&
                        <div className="flex mt-3 justify-center">
                          <Autocomplete
                            disablePortal
                            id="input-geographic-area"
                            onInputChange={(event: any, newInputValue: string | null) => 
                              { handleSearchGeographicArea(event, newInputValue) }}
                            onChange={(event: any, newValue: string | null) => {
                              handleSelectGeographicArea(event, newValue)
                            }}
                            options={
                              arrayGeographicArea.map(geographicArea => 
                                `${geographicArea.geographic_area_name} - ${geographicArea.id_geographic_area}`)
                            }
                            value={
                              strategicInformationPerson.geographic_area_name
                            }
                            sx={{ width: 300 }}
                            renderInput={(params) => <TextField {...params} label="Area geografica" />}
                            />
                        </div>
                      } 
                    </>   
                    }
                  </div>
                </div>
              }    
            
          </div>
          <div className="flex flex-row justify-center">
            <Button 
            label="Aceptar" 
            onClick={(e:any) => {handleOnSubmit(e)}}
            style="mr-3 mt-3"
            />
          {
            (action===1 || action===3) && 
              <Button 
                style="mt-3"
                label="Cancelar" 
                onClick={() => {handleSubmit(true)}}
                colorButton={1}
                />
            
          }
          </div>  
        </form>
      </div>
      {
        (action == 0) &&
        <div className="ml-5 mt-10 flex flex-col items-center">
            <input type="file" onChange={handleFileChange} />
            <Button 
            label="Analizar imagen" 
            onClick={() => {handleUpload()}}
            style="mr-3 mt-3"
            />
        </div>
      }

    </div>
  )
}

export default FormPerson;