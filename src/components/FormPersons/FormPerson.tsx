import { useEffect, useState } from "react";
import Input from "../UIcomponents/Input";
import { Autocomplete, TextField } from "@mui/material";
import Button from "../UIcomponents/Button";
import { ICollaborator, IColony, IGeographicArea, IMember, IRequest, IStrategy, IStructure } from "../../interfaces/interfaces";
import requester from "../../helpers/Requester";
import Chip from "@mui/material/Chip";

const initialPersonState:IMember = {
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

const avoidNull = (data: any, replace: any):any => {
  return data === null ? replace : data;
}


//Auxiliar functions to show inputs
const showLeaderInputFunction = (idStrategy:number|undefined, arrayStrategyLevel:IStrategy[]):boolean => {
  if(idStrategy!==undefined && idStrategy!==null && arrayStrategyLevel[0]!==undefined) {
    const index:number = arrayStrategyLevel.findIndex(strategyLevel => strategyLevel.id_strategy === idStrategy)

    if(arrayStrategyLevel[index].cardinality_level !== 1) return true  
  }  
  return false
}

const showFollowerInputFunction = (idStrategy:number|undefined, arrayStrategyLevel:IStrategy[]):boolean => {
  //Always "arrayStrategyLevel" will be ordered in ascending order according to "cardinality"
  //The order will be 1, 2, 3 (took the cardinality)
  if(idStrategy!==undefined && idStrategy!==null && arrayStrategyLevel[0]!==undefined) {
    if(arrayStrategyLevel[arrayStrategyLevel.length - 1].id_strategy !== idStrategy) return true
  }
  return false
}

const showGeographicAreaInputFunction = (idStrategy:number|undefined, arrayStrategyLevel:IStrategy[]):boolean => {
  if(idStrategy!==undefined && idStrategy!==null && arrayStrategyLevel[0]!==undefined) {
    const index:number = arrayStrategyLevel.findIndex(strategyLevel => strategyLevel.id_strategy == idStrategy);
    if(arrayStrategyLevel[index].zone_type !== '') return true
  }
  return false
}

//Calls to API
const getStrategy = async ():Promise<IStrategy[]> => {
  try {
    const strategy: IRequest<IStrategy[]> = await requester({
      url: `/strategyLevels`,
      method: 'GET'
    })
    
    if(strategy.data !== undefined) {
      return strategy.data;
    } else {
      return [];
    }
  } catch (error) {
    console.log(error)
    return [];
  }

  
  // if(strategy.data !== undefined) {
  //   setArrayStrategyLevel(strategy.data)
  //   // setShowLeaderInput(showLeaderInputFunction(initialIdStrategy, strategy.data))
  //   // setShowFollowerInput(showFollowerInputFunction(initialIdStrategy, strategy.data))
  //   // setShowGeographicArea(showGeographicAreaInputFunction(initialIdGeographicArea, arrayStrategyLevel))
  // }
}

const addNewMember = async (basicData: any, idLeader?: number, idFollowers?: IStructure[], idGeographicArea?: number):Promise<void> => {
  try {
    const response:IRequest<any> = await requester({
      url: '/members/', 
      method: "POST", 
      data: basicData})

    if(response.data !== undefined) {
      const idMember:number = response.data.idMember
  
      //Update member's leader
      idLeader !== undefined && await updateLeader(idMember, idLeader)
  
      //Update member's followers 
      idFollowers !== undefined && await updateFollowers(idMember, idFollowers)
  
      //Update geographic area's manager
      idGeographicArea !== undefined && idGeographicArea !== undefined && await updateGeographicAreaManage(idMember, idGeographicArea);
    }
    
  } catch (error) {
    console.log(error)
  }
}

const updateMember = async (basicData: any, idStrategy?: number, idLeader?: number, idFollowers?: IStructure[], idGeographicArea?: number):Promise<void> => {
  try {
    console.log(basicData)
    if(basicData.idMember !== undefined) {
      console.log("ok")
      const idMember:number = basicData.idMember;

      //Update basic member's information 
      const response:IRequest<undefined> = await requester({
        url: `/members/${idMember}`,
        method: "PUT",
        data: basicData
      })
      
      console.log(response)
      //Update member's strategy level
      idStrategy !== undefined && await updateStrategyLevel(idMember, idStrategy)
  
      //Update member's leader
      idLeader !== undefined && await updateLeader(idMember, idLeader)
  
      //Update member's followers 
      idFollowers !== undefined && await updateFollowers(idMember, idFollowers)

      //Update geographic area's manager
      idGeographicArea !== undefined && await updateGeographicAreaManage(idMember, idGeographicArea);
    }
    console.log("Finalizing")
  } catch (error) {
    console.log(error)
    console.log("No se pudo actualizar")
  }
}

const updateStrategyLevel = async (idMember: number, idStrategy: number):Promise<void> => {
if(idStrategy!== undefined && idStrategy!==null) {
  const response:IRequest<undefined> = await requester({
    url: `/members/strategicInformation/strategyLevel/${idMember}/${idStrategy}`,
    method: 'PUT'
  });
  console.log(response)
}
}

const updateLeader = async (idMember: number, idLeader: number):Promise<void> => {
  if(idLeader!== undefined && idLeader!==null) {
    await requester({
      url: `/members/strategicInformation/leader/${idMember}/${idLeader}`,
      method: 'PUT'
    });
  }
}

const updateFollowers = async (idMember: number, idFollowers: IStructure[]):Promise<void> => {
  if(idFollowers[0] !== undefined) {
    const followers: number[] = [];
    idFollowers.forEach(follower => followers.push(follower.id_member));
    await requester({
      url: `/members/strategicInformation/followers/${idMember}`,
      method: 'PUT',
      data: { followers }
    })
  }
}

const updateGeographicAreaManage = async(idMember: number, idGeographicArea: number):Promise<void> => {
  if(idGeographicArea !== undefined && idGeographicArea !== null) {
    const response:IRequest<undefined> = await requester({
      url: `/geographicAreas/strategicInformation/manager/${idGeographicArea}/${idMember}`,
      method: 'PUT'
    })
    console.log(response)
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
      console.log("There was an error while searching the colinies")
    }
    return [];
  } catch (error) {
    console.log("There was an error while searching the colinies")
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
      
    console.log("There was an error while searching the leader")
    return [];
  } catch (error) {
    console.log("There was an error while searching the leader")
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
    
    console.log("There was an error while searching the leader")
    return [];
  } catch (error) {
    console.log("There was an error while searching the leader")
    return [];
  }
}

/*
  action props
  0 = add member
  1 = update member
  2 = add collaborator
  3 = update collaborator
*/

const FormPerson = (
  {
    label,
    action,
    handleSubmit,
    initialPersonInformation = initialPersonState,
    initialStrategicInformation = initialStrategicInformationState,


    initialIdStrategy = undefined,
    initialIdGeographicArea = undefined,

    initialIdFollowers = [],
  }: {
    label: string,
    action: number,
    handleSubmit?: any;
    initialPersonInformation?: IMember, 
    initialStrategicInformation?: IStructure, 

    initialIdStrategy?: number|undefined,

    initialIdGeographicArea?: number,
    initialIdFollowers?: IStructure[]|undefined,
  }) => {
    //Common fileds
    const [person, setPerson] = useState<IMember>(initialPersonInformation);
    const [strategicInformationPerson, setStrategicInformationPerson] = useState<IStructure>(initialStrategicInformation)


    // Members fields
    const [idStrategy, setIdStrategy] = useState<number|undefined>(avoidNull(initialIdStrategy, undefined));

    const [idFollowers, setIdFollower] = useState<IStructure[]>(initialIdFollowers === undefined ? [] : initialIdFollowers);

    //Collaborator fields
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')

    //Operational input 
    const [searchFollower, setSearchFollower] = useState<string>('')

    //States to save the results of the search
    const [arraySearchColony, setArraySearchColony] = useState<IColony[]>([])
    const [arrayStrategyLevel, setArrayStrategyLevel] = useState<IStrategy[]>([])
    const [arrayLeader, setArrayLeader] = useState<IStructure[]>([])
    const [arrayFollower, setArrayFollower] = useState<IStructure[]>([])
    const [arrayGeographicArea, setArrayGeographicArea] = useState<IGeographicArea[]>([])

    
    //Show data
    const [showLeaderInput, setShowLeaderInput] = useState<boolean>(false);
    const [showFollowerInput, setShowFollowerInput] = useState<boolean>(false);
    const [showGeographicArea, setShowGeographicArea] = useState<boolean>(false);

    useEffect(() => {
      getStrategy().then((dataResponse) => {
        setArrayStrategyLevel(dataResponse)
        setShowLeaderInput(showLeaderInputFunction(initialIdStrategy, dataResponse))
        setShowFollowerInput(showFollowerInputFunction(initialIdStrategy, dataResponse))
        setShowGeographicArea(showGeographicAreaInputFunction(initialIdGeographicArea, dataResponse))
      })
      console.log(initialPersonInformation)
    }, [])

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

          //Pending
          /*
            If the user delete the strategic level, it's necessary to delete the current 
            member's strategic information
          */
          handleSelectLeader("", null);
          setIdFollower([]);
          setStrategicInformationPerson({
            ...strategicInformationPerson,
            role: "",
            id_strategy: 0
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
          id_leader: 0
        });
      else { 
        setStrategicInformationPerson({
          ...strategicInformationPerson, 
          id_strategy: strategyLevelSelected.id_strategy,
          role: strategyLevelSelected.role,
          //If there is a change of level, it's necessary to delete all the current strategic data
          first_name_leader: "",
          id_leader: 0
        });
        setShowFollowerInput(
          showFollowerInputFunction(strategyLevelSelected.id_strategy, arrayStrategyLevel));
        setShowLeaderInput(
          showLeaderInputFunction(strategyLevelSelected.id_strategy, arrayStrategyLevel));
        setShowGeographicArea(
          showGeographicAreaInputFunction(strategyLevelSelected.id_strategy, arrayStrategyLevel));

      }

      //Pending
      /*
        If the user change of strategic level, it's necessary to delete the current 
        member's strategic information
      */
      
      setIdFollower([]);
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
      if(leaderSelected === undefined || newInputValue === null) 
        setStrategicInformationPerson({
          ...strategicInformationPerson, 
          first_name_leader: "",
          id_leader: 0});
      else 
        setStrategicInformationPerson({
          ...strategicInformationPerson, 
          first_name_leader: newInputValue,
          id_leader: leaderSelected.id_member});
      
      //Reset the array of leader (the leader already was founded)
      setArrayLeader([]);
    }

    //Follower related
    const handleSearchFollowers = async (event: any, newInputValue: string | null) => {
      if(newInputValue!== null) {
        setSearchFollower(newInputValue);
        if(idStrategy !== undefined) {
          if(newInputValue==='') setArrayFollower([]); //If the input is '' empty the array
          /*If the user is searching a follower, and there is still empty the array, ask 
          to the API, other
          */
          if(arrayFollower[0] === undefined && newInputValue !== '') {
            const followerResult: IRequest<IStructure[]> = await requester({
              url: `/members/strategicInformation/followers/${idStrategy}/${newInputValue}`,
              method: `GET`
            }) 
            if(followerResult.data !== undefined) 
              setArrayFollower(followerResult.data)
          }
        } else console.log("idStrategy cannot be undefined")
      }
    }

    const handleAddFollower = async(event:any, newInputValue: string | null) => {
      setSearchFollower('');
      const data:IStructure|undefined = arrayFollower
      .find(follower => newInputValue === `${follower.first_name} ${follower.last_name}`);
      if(data !== undefined) setIdFollower(idFollowers.concat(data))
    }

    const handleDeleteFollower = async(e: IStructure) => { 
      setIdFollower(idFollowers.filter(follower => follower.id_member !== e.id_member)) 
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
          // If the leader's array is empty and the user's input is different to empty, request data to API
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
      arrayGeographicArea.find(geographicArea => `${geographicArea.geographic_area_name}-${geographicArea.id_geographic_area}` === newInputValue);

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
          geographic_area_name: geographicAreaSelected.geographic_area_name,
          id_geographic_area: geographicAreaSelected.id_geographic_area})
      
      setArrayGeographicArea([]);
    }

    //Handler to submit
    const handleOnSubmit = async(e: any) => {
      if(
        
        person.first_name === '' ||
        person.last_name === '' ||
        person.street === '' ||
        person.ext_number === '' ||
        person.cell_phone_number === '' ||
        person.id_colony === undefined ||
        strategicInformationPerson.id_strategy === undefined
        ){
          console.log("There can't be empty data")
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
        "idColony": avoidNull(person.id_colony, 0),
        "idStrategyLevel": avoidNull(strategicInformationPerson.id_strategy, 0)
      }

      try {
        if(action==0) {
          await addNewMember(
            basicData, 
            strategicInformationPerson.id_leader, 
            strategicInformationPerson.followers, 
            strategicInformationPerson.id_geographic_area);
        } else if(action==1) {
          console.log("initializing")
          await updateMember(
            basicData, 
            strategicInformationPerson.id_strategy, 
            strategicInformationPerson.id_leader, 
            strategicInformationPerson.followers, 
            strategicInformationPerson.id_geographic_area);
          handleSubmit(true)
        }
        //Reset variables
        //Basic information
        resetAllStates()
      } catch (error) {
        console.log("Err: ", error)
      }
    }

    //Auxiliar functions
    const filterSelectedFollowers = (arrayTofilter: IStructure[]):IStructure[] => {
      const filterFollowersSelected:IStructure[] = [];
          
      for(let i = 0; i < arrayTofilter.length; i++) {
        if(idFollowers.find(
            follower => follower.id_member === arrayTofilter[i].id_member) ===
            undefined
          ) filterFollowersSelected.push(arrayTofilter[i])
      }

      return filterFollowersSelected;
    }

    const resetAllStates = ():void => {
      //Basic information states related
      setPerson(initialPersonState);

      //Strategic information states related
      setStrategicInformationPerson(initialStrategicInformationState);
      
      //Autocomplete store data states related
      setArraySearchColony([])
      setArrayLeader([])
      setArrayFollower([])
      setArrayGeographicArea([])


      setIdFollower([])
      setIdStrategy(undefined)

      setSearchFollower('')
            

      //Collaborator information states related
      setEmail('')
      setPassword('')
    }


  return (
    <>
      <div className="text-center text-xl font-bold">
        {label}
      </div>
      <form>
        <div className="flex flex-row">
          <div className="mr-3">
            <p className="text-md">
              Información basica
            </p>
            <div className="flex flex-row">
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
            <div className="flex flex-row ">
              <Input
                onType={setPerson}
                objectValue={person} 
                inputName={"street"}
                placeholder={'Calle'}
                inputType={'text'}
                required={true}
              />
            </div>
            <div className="flex flex-row">
              <div className="mr-2">
                <Input
                  onType={setPerson}
                  objectValue={person} 
                  inputName={"ext_number"}
                  placeholder={'No. Exterior'}
                  inputType={'text'}
                  required={true}
                />
              </div>
              <Input
                onType={setPerson}
                objectValue={person} 
                inputName={"int_number"}
                placeholder={'No. Interno (opcional)'}
                inputType={'text'}
              />
            </div>
            <div className="flex flex-row">
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
            {
              (action === 2 || action === 3) &&
                <div className="flex flex-row">
                  <div className="mr-2">
                    <Input
                      onType={setEmail}
                      objectValue={person} 
                      inputName={"int_number"}
                      placeholder={'email'}
                      inputType={'text'}
                    />
                  </div>
                  <Input
                    onType={setPassword}
                    objectValue={person} 
                    inputName={"password"}
                    placeholder={'Contraseña'}
                    inputType={'text'}
                  />
                </div>
            }
          </div>
          {
            (action === 0 || action === 1) &&
            <div className="mt-3">
              <p className="text-md">Información estrategica</p>
              <div className="flex flex-col">
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
                          handleAddFollower(event,newInputValue)}
                        options={ 
                          filterSelectedFollowers(arrayFollower).map(follower => 
                            `${follower.first_name} ${follower.last_name}`)
                        }
                        sx={{ width: 300 }}
                        value={searchFollower}
                        renderInput={(params) => <TextField {...params} label="Seguidores" />}
                        />
                    </div>
                    <div className=" flex justify-center">
                      <div className="w-52 mt-3 flex flex-wrap justify-center">
                          {
                            idFollowers.map((follower) => 
                              <div key={follower.id_member} className="m-1">
                                <Chip 
                                  label={`${follower.first_name} ${follower.last_name}`} 
                                  onDelete={() => handleDeleteFollower(follower)}
                                  />
                              </div>
                            )
                          }
                      </div>
                    </div>
                  </>
                }
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
                      options={arrayGeographicArea.map(geographicArea => 
                        `${geographicArea.geographic_area_name}-${geographicArea.id_geographic_area}`)}
                      value={strategicInformationPerson.geographic_area_name}
                      sx={{ width: 300 }}
                      renderInput={(params) => <TextField {...params} label="Area geografica" />}
                      />
                  </div>
                }
              </div>
            </div>
          }
        </div>
        <div className="flex flex-row justify-center">
          <Button label="Aceptar" onClick={(e:any) => {handleOnSubmit(e)}}/>          
        {
          (action===1 || action===3) && 
            <Button 
              label="Cancelar" 
              onClick={(e:any) => {
                handleSubmit(true)
              }}
              colorButton="bg-red-400"
              colorButtonHover="bg-red-600"
              />
        }
        </div>  
      </form>
    </>
  )
}

export default FormPerson;