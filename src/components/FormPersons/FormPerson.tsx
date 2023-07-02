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
    initialIdColony = undefined,
    initialSearchColony = '',

    initialIdLeader = undefined,
    initialSearchLeader = undefined,

    initialIdStrategy = undefined,
    initialIdGeographicArea = undefined,

    initialSearchStrategyLevel = undefined,
    initialIdFollowers = [],
  }: {
    label: string,
    action: number,
    handleSubmit?: any;
    initialPersonInformation?: IMember, 

    initialIdColony?: number|undefined,
    initialSearchColony?: string,

    initialIdLeader?: number|undefined,
    initialSearchLeader?: string,

    initialIdStrategy?: number|undefined,
    initialSearchStrategyLevel?: string,

    initialIdGeographicArea?: number,
    initialIdFollowers?: IStructure[]|undefined,
  }) => {
    //Common fileds
    const [person, setPerson] = useState<IMember>(initialPersonInformation);

    const [idColony, setIdColony] = useState<number|undefined>(initialIdColony);

    // Members fields
    const [idStrategy, setIdStrategy] = useState<number|undefined>(avoidNull(initialIdStrategy, undefined));
    const [idLeader, setIdLeader] = useState<number|undefined>(initialIdLeader);
    const [idFollowers, setIdFollower] = useState<IStructure[]>(initialIdFollowers === undefined ? [] : initialIdFollowers);
    const [idGeographicArea, setIdGeographicArea] = useState<number|undefined>(avoidNull(initialIdStrategy, undefined));

    //Collaborator fields
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')

    //Operational input
    const [arraySearchColony, setArraySearchColony] = useState<IColony[]>([])
    const [arrayStrategyLevel, setArrayStrategyLevel] = useState<IStrategy[]>([])
    const [arrayLeader, setArrayLeader] = useState<IStructure[]>([])
    const [arrayFollower, setArrayFollower] = useState<IStructure[]>([])
    const [arrayGeographicArea, setArrayGeographicArea] = useState<IGeographicArea[]>([])
    
    const [searchFollower, setSearchFollower] = useState<string>('')
    const [searchLeader, setSearchLeader] = useState<string|undefined>(
      initialSearchLeader===' ' ? undefined : initialSearchLeader)
    const [searchStrategyLevel, setSearchStrategyLevel] = useState<string|undefined>(initialSearchStrategyLevel)
    const [searchColony, setSearchColony] = useState<string>(avoidNull(initialSearchColony, ''));
    const [searchGeographicArea, setSearchGeographicArea] = useState<string|undefined>(avoidNull(initialSearchColony, ''));

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

    //Handlers basic information
    const handleSearchColony = async (event: any, newInputValue: string | null) => {
      if(newInputValue !== null) {
        setSearchColony(newInputValue)
        if(newInputValue==='') setArraySearchColony([])
        if(arraySearchColony[0] === undefined && newInputValue !== '') {
          const coloniesResult: IRequest<IColony[]> = await requester({
            url: `/colonies/name/${newInputValue}`,
            method: 'GET',
          })
          if(coloniesResult.data !== undefined) setArraySearchColony(coloniesResult.data)
        }
      }
    }

    const handleSelectColony = async (event: any, newInputValue: string | null) => {
      const colonySelected:IColony|undefined = arraySearchColony.find(searchColony => searchColony.name_colony === newInputValue);
      if(colonySelected===undefined) setIdColony(undefined);
      else setIdColony(colonySelected.id_colony);
    }

    //Handlers strategic information 
    //Strategy level related
    const handleSelectStrategyLevel = async (event: any, newValue: string | null) => {
      const strategyLevelSelected: IStrategy|undefined = 
      arrayStrategyLevel.find(strategyLevel => strategyLevel.role === newValue)
      if(strategyLevelSelected===undefined) setIdStrategy(undefined);
      else { 
        setIdStrategy(strategyLevelSelected.id_strategy)
        setShowFollowerInput(showFollowerInputFunction(strategyLevelSelected.id_strategy, arrayStrategyLevel))
        setShowLeaderInput(showLeaderInputFunction(strategyLevelSelected.id_strategy, arrayStrategyLevel))
        setShowGeographicArea(showGeographicAreaInputFunction(strategyLevelSelected.id_strategy, arrayStrategyLevel))
      }
      setIdFollower([]);
      setIdLeader(undefined);
      setSearchLeader('');
    }

    const handleSearchStrategyLevel = async (event: any, newInputValue: string | null) => {
      if (newInputValue !== null) {
        if(newInputValue!=="") setSearchStrategyLevel(newInputValue)
        else {
          handleSelectLeader("", null);
          setIdFollower([]);
        }
      }

    }

    //Searcher related
    const handleSearchLeader = async (event: any, newInputValue: string | null) => {
      if(newInputValue !== null) {
        setSearchLeader(newInputValue);
        if(idStrategy !== undefined) {
          if(newInputValue==='') setArrayLeader([]);
          if(arrayLeader[0] === undefined && newInputValue !== '') {
            const leaderResult: IRequest<IStructure[]> = await requester({
              url: `/members/strategicInformation/leaders/${idStrategy}/${newInputValue}`,
              method: `GET`
            }) 
            if(leaderResult.data !== undefined) 
              setArrayLeader(leaderResult.data)
          }
        } else console.log("idStrategy cannot be undefined")
      }
    }

    const handleSelectLeader = async (event: any, newInputValue: string | null) => {
      const leaderSelected: IStructure|undefined = 
      arrayLeader.find(leader => `${leader.first_name} ${leader.last_name}` === newInputValue);
      if(leaderSelected===undefined) setIdLeader(undefined);
      else setIdLeader(leaderSelected.id_member);
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

    //Geographic area related
    const handleSearchGeographicArea = async (event: any, newInputValue: string | null) => {
      if(newInputValue !== null) {
        setSearchGeographicArea(newInputValue);
        if(idStrategy !== undefined) {
          if(newInputValue==='') setArrayGeographicArea([]);
          console.log(idStrategy)
          if(arrayGeographicArea[0] === undefined && newInputValue !== '') {
            const response: IRequest<IGeographicArea[]> = await requester({
              url: `/geographicAreas/strategicInformation/${idStrategy}/${newInputValue}`,
              method: `GET`
            }) 
            if(response.data !== undefined) 
              setArrayGeographicArea(response.data)
          }
        } else console.log("idStrategy cannot be undefined")
      }
    }

    const handleSelectGeographicArea = async (event: any, newInputValue: string | null) => {
      const geographicAreaSelected: IGeographicArea|undefined = 
      arrayGeographicArea.find(geographicArea => `${geographicArea.geographic_area_name}-${geographicArea.id_geographic_area}` === newInputValue);
      if(geographicAreaSelected===undefined) setIdGeographicArea(undefined);
      else setIdGeographicArea(geographicAreaSelected.id_geographic_area);
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
        idColony === undefined ||
        idStrategy === undefined
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
        "idColony": avoidNull(idColony, 0),
        "idStrategyLevel": avoidNull(idStrategy, 0)
      }

      try {
        if(action==0) {
          await addNewMember(basicData, idLeader, idFollowers, idGeographicArea);
        } else if(action==1) {
          console.log("initializing")
          await updateMember(basicData, idStrategy, idLeader, idFollowers, idGeographicArea);
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
      setPerson(initialPersonState)
      setIdColony(undefined)

      setArraySearchColony([])
      setSearchColony('')
      
      //Strategic information states related
      setIdLeader(undefined)
      setIdFollower([])
      setIdStrategy(undefined)
      setIdGeographicArea(undefined)

      setArrayLeader([])
      setArrayFollower([])
      setArrayGeographicArea([])
      
      setSearchFollower('')
      setSearchLeader('')
      setSearchStrategyLevel('')
      setSearchGeographicArea('')
      

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
                value={searchColony}
                options={ arraySearchColony.map((searchColony => searchColony.name_colony)) }
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
                    value={
                      searchStrategyLevel
                      // arrayStrategyLevel[0]===undefined ? undefined : searchStrategyLevel
                    }
                    options={ 
                      arrayStrategyLevel[0]===undefined ? [] :
                      arrayStrategyLevel.map((strategyLevel => strategyLevel.role)) }
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
                      value={searchLeader}
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
                      value={searchGeographicArea}
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
        </div>  
        {
          (action===1 || action===3) && 
            <Button 
              label="Cancelar" 
              onClick={(e:any) => {
                handleSubmit(true)
              }}
              />
        }
      </form>
    </>
  )
}

export default FormPerson;