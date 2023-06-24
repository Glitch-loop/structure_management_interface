import { useEffect, useState } from "react";
import Input from "../UIcomponents/Input";
import { Autocomplete, TextField } from "@mui/material";
import Button from "../UIcomponents/Button";
import { IColony, IRequest, IStrategy, IStructure } from "../../interfaces/interfaces";
import requester from "../../helpers/Requester";
import Chip from "@mui/material/Chip";

const avoidNull = (data: any):string => {
  return data === null ? '' : data;
}

const FormPerson = (
  {
    label,
    action,
    idPerson = undefined,
    initialFirstName = '',
    initialLastName = '',
    initialStreet = '',
    initialExtNumber = '',
    initialIntNumber = '',
    initialCellphoneNumber = '',
    initialIdColony = undefined,
    initialSearchColony = '',

    initialIdLeader = undefined,
    initialSearchLeader = '',
    initialIdStrategy = undefined,
    initialSearchStrategyLevel = '',
    initialIdFollowers = [],
  }: {
    label: string,
    action: number,
    idPerson?: number | undefined,

    initialFirstName?: string,
    initialLastName?: string,
    initialStreet?: string,
    initialExtNumber?: string,
    initialIntNumber?: string,
    initialCellphoneNumber?: string,
    initialIdColony?: number|undefined,
    initialSearchColony?: string,

    initialIdLeader?: number|undefined,
    initialSearchLeader?: string,
    initialIdStrategy?: number|undefined,
    initialSearchStrategyLevel?: string,
    initialIdFollowers?: IStructure[]|undefined,
  }) => {
    //Common fileds
    const [firstName, setFirstName] = useState<string>(avoidNull(initialFirstName));
    const [lastName, setLastName] = useState<string>(avoidNull(initialLastName));
    const [street, setStreet] = useState<string>(avoidNull(initialStreet));
    const [extNumber, setExtNumber] = useState<string>(avoidNull(initialExtNumber));
    const [intNumber, setIntNumber] = useState<string>(avoidNull(initialIntNumber));
    const [cellphoneNumber, setCellphoneNumber] = useState<string>(avoidNull(initialCellphoneNumber));
    const [idColony, setIdColony] = useState<number|undefined>(initialIdColony);

    // Members fields
    const [idLeader, setIdLeader] = useState<number|undefined>(initialIdLeader);
    const [idFollowers, setIdFollower] = useState<IStructure[]>(initialIdFollowers === undefined ? [] : initialIdFollowers);
    const [idStrategy, setIdStrategy] = useState<number|undefined>(initialIdStrategy);

    //Collaborator fields
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')

    //Operational input
    const [arraySearchColony, setArraySearchColony] = useState<IColony[]>([])
    const [arrayStrategyLevel, setArrayStrategyLevel] = useState<IStrategy[]>([])
    const [arrayLeader, setArrayLeader] = useState<IStructure[]>([])
    const [arrayFollower, setArrayFollower] = useState<IStructure[]>([])
    const [searchFollower, setSearchFollower] = useState<string>('')
    const [searchLeader, setSearchLeader] = useState<string|undefined>(
      initialSearchLeader===' ' ? undefined : initialSearchLeader)
    const [searchStrategyLevel, setSearchStrategyLevel] = useState<string>(avoidNull(initialSearchStrategyLevel))
    const [searchColony, setSearchColony] = useState<string>(avoidNull(initialSearchColony));

    useEffect(() => {
      getStrategy()
    }, [])

    // useEffect functions
    const getStrategy = async () => {
      const strategy: IRequest<IStrategy[]> = await requester({
        url: `/strategyLevels`,
        method: 'GET'
      })
      if(strategy.data !== undefined) setArrayStrategyLevel(strategy.data)
    }

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
    const handleSelectStrategyLevel = async (event: any, newValue: string | null) => {
      const strategyLevelSelected: IStrategy|undefined = 
      arrayStrategyLevel.find(strategyLevel => strategyLevel.role === newValue)
      if(strategyLevelSelected===undefined) setIdStrategy(undefined);
      else setIdStrategy(strategyLevelSelected.id_strategy);
      setIdFollower([]);
      setIdLeader(undefined);
      setSearchLeader('');
    }

    const handleSearchStrategyLevel = async (event: any, newInputValue: string | null) => {
      if (newInputValue !== null)
        setSearchStrategyLevel(newInputValue)
    }

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
    }

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

    //Handler to submit
    const handleOnSubmit = async(e: any) => {
      if(
        firstName==='' ||
        lastName==='' ||
        street==='' ||
        extNumber==='' ||
        cellphoneNumber==='' ||
        idColony=== undefined ||
        idStrategy=== undefined
        ){
          console.log("There can't be empty data")
      }

      e.preventDefault();
      const basicData = {
        "firstName": firstName,
        "lastName": lastName,
        "street": street,
        "extNumber": extNumber,
        "intNumber": intNumber,
        "cellphoneNumber": cellphoneNumber,
        "idColony": idColony,
        "idStrategyLevel": idStrategy
      }

      try {
        if(action==0) {
          await addNewMember(basicData);
        } else if(action==1) {
          await updateMember(basicData);
        }

        //Reset variables
        //Basic information
        resetAllStates()
        console.log("Everything is OK")
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
      setFirstName('')
      setLastName('')
      setStreet('')
      setExtNumber('')
      setIntNumber('')
      setCellphoneNumber('')
      setIdColony(undefined)

      setArraySearchColony([])
      setSearchColony('')
      
      //Strategic information states related
      setIdLeader(undefined)
      setIdFollower([])
      setIdStrategy(undefined)

      setArrayLeader([])
      setArrayFollower([])
      setSearchFollower('')
      setSearchLeader('')
      setSearchStrategyLevel('')

      //Collaborator information states related
      setEmail('')
      setPassword('')
    }

    const addNewMember = async (basicData: any) => {
        const response:IRequest<any> = await requester({
          url: '/members/', 
          method: "POST", 
          data: basicData})
        
        if(response.data !== undefined) {
          const idMember:number = response.data.idMember

          //Update member's leader
          updateLeader(idMember)

          //Update member's followers 
          updateFollowers(idMember)
        }
    }

    const updateMember = async (basicData: any) => {
      if(idPerson !== undefined) {
        console.log("Member to update: ", idPerson)
        console.log("New info: ", basicData)
        const response:IRequest<any> = await requester({
          url: `/members/${idPerson}`,
          method: "PUT",
          data: basicData
        })
        console.log(response)
  
        //Update member's leader
        updateLeader(idPerson)
  
        //Update member's followers 
        updateFollowers(idPerson)
      }
    }

    const updateLeader = async (idMember: number) => {
      await requester({
        url: `/members/strategicInformation/leader/${idMember}/${idLeader}`,
        method: 'PUT'
      });
    }

    const updateFollowers = async (idMember: number) => {
      const followers: number[] = [];
      idFollowers.forEach(follower => followers.push(follower.id_member));
      await requester({
        url: `/members/strategicInformation/followers/${idMember}`,
        method: 'PUT',
        data: { followers }
      })
    }

  return (
    <>
      <div className="text-center text-xl font-bold">
        {label}
      </div>
      <form onSubmit={handleOnSubmit}>
        <div className="flex flex-row">
          <div className="mr-3">
            <p className="text-md">
              Información basica
            </p>
            <div className="flex flex-row">
              <div className="mr-2">
                <Input
                  onType={setFirstName}
                  inputValue={firstName} 
                  inputName={'Nombre(s)'}
                  inputType={'text'}
                  required={true}
                />
              </div>
              <Input
                onType={setLastName}
                inputValue={lastName} 
                inputName={'Apellidos'}
                inputType={'text'}
                required={true}
              />
            </div>
            <div className="flex flex-row ">
              <Input
                onType={setStreet}
                inputValue={street} 
                inputName={'Calle'}
                inputType={'text'}
                required={true}
              />
            </div>
            <div className="flex flex-row">
              <div className="mr-2">
                <Input
                  onType={setExtNumber}
                  inputValue={extNumber} 
                  inputName={'No. Exterior'}
                  inputType={'text'}
                  required={true}
                />
              </div>
              <Input
                onType={setIntNumber}
                inputValue={intNumber} 
                inputName={'No. Interno (opcional)'}
                inputType={'text'}
              />
            </div>
            <div className="flex flex-row">
              <Input
                  onType={setCellphoneNumber}
                  inputValue={cellphoneNumber} 
                  inputName={'Telefono'}
                  inputType={'text'}
                  required={true}
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
            <div className="flex flex-row">
              <div className="mr-2">
                <Input
                  onType={setEmail}
                  inputValue={email} 
                  inputName={'Email'}
                  inputType={'text'}
                />
              </div>
              <Input
                onType={setPassword}
                inputValue={password} 
                inputName={'Contraseña'}
                inputType={'text'}
              />
            </div>
          </div>
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
                  value={searchStrategyLevel}
                  options={ arrayStrategyLevel.map((strategyLevel => strategyLevel.role)) }
                  sx={{ width: 300 }}
                  renderInput={(params) => <TextField {...params} label="Nivel jerarquico" />}
                  />
              </div>
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
            </div>
          </div>
        </div>
        <div className="flex flex-row justify-center">
          <Button label="Aceptar"/>
        </div>
      </form>
    </>
  )
}

export default FormPerson;