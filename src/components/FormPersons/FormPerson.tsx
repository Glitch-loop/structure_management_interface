import { useEffect, useState } from "react";
import Input from "../UIcomponents/Input";
import { Autocomplete, TextField, requirePropFactory } from "@mui/material";
import Button from "../UIcomponents/Button";
import { IColony, IRequest, IStrategy, IStructure } from "../../interfaces/interfaces";
import requester from "../../helpers/Requester";

const top100Films = [
  { label: 'The Shawshank Redemption', year: 1994 },
  { label: 'The Godfather', year: 1972 },
  { label: 'The Godfather: Part II', year: 1974 },
]


const FormPerson = (
  {
    label,
  }: {
    label: string
  }) => {
    //Common fileds
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [street, setStreet] = useState<string>('');
    const [extNumber, setExtNumber] = useState<string>('');
    const [intNumber, setIntNumber] = useState<string>('');
    const [cellphoneNumber, setCellphoneNumber] = useState<string>('');
    const [idColony, setIdColony] = useState<number>();

    // Members fields
    const [idLeader, setIdLeader] = useState<number>();
    const [idFollowers, setIdFollower] = useState<number[]>();
    const [idStrategy, setIdStrategy] = useState<number>();

    //Collaborator fields
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')

    //Operational input
    const [arraySearchColony, setArraySearchColony] = useState<IColony[]>([])
    const [arrayStrategyLevel, setArrayStrategyLevel] = useState<IStrategy[]>([])
    const [arrayLeader, setArrayLeader] = useState<IStructure[]>([])

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

    //Handlers
    const handlerColonySearch = async (newInputValue: string) => {
      if(newInputValue==='') setArraySearchColony([])
      if(arraySearchColony[0] === undefined && newInputValue !== '') {
        const coloniesResult: IRequest<IColony[]> = await requester({
          url: `/colonies/name/${newInputValue}`,
          method: 'GET',
        })
        if(coloniesResult.data !== undefined) setArraySearchColony(coloniesResult.data)
      }
    }

    const handlerSearchLeader = async (newInputValue: string) => {
      if(idStrategy !== undefined) {
        if(newInputValue==='') setArrayLeader([]);
        if(arrayLeader[0] === undefined && newInputValue !== '') {
          const leaderResult: IRequest<IStructure[]> = await requester({
            url: `/members/strategicInformation/leaders/${idStrategy}/${newInputValue}`,
            method: `GET`
          }) 

          if(leaderResult.data !== undefined) {
            console.log(leaderResult)
            setArrayLeader(leaderResult.data)}
        }
      } else console.log("idStrategy cannot be undefined")
    }

  return (
    <>
      <div className="text-center text-xl font-bold">
        {label}
      </div>
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
              />
            </div>
            <Input
              onType={setLastName}
              inputValue={lastName} 
              inputName={'Apellidos'}
              inputType={'text'}
            />
          </div>
          <div className="flex flex-row ">
            <Input
              onType={setStreet}
              inputValue={street} 
              inputName={'Calle'}
              inputType={'text'}
            />
          </div>
          <div className="flex flex-row">
            <div className="mr-2">
              <Input
                onType={setExtNumber}
                inputValue={extNumber} 
                inputName={'No. Exterior'}
                inputType={'text'}
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
              />
          </div>
          <div className="flex mt-3 justify-center">
            <Autocomplete
              disablePortal
              id="combo-box-demo"
              options={ arraySearchColony.map((searchColony => searchColony.name_colony)) }
              onChange={(event: any, newValue: any) => {
                const colonySelected:IColony|undefined = arraySearchColony.find(searchColony => searchColony.name_colony === newValue);
                if(colonySelected===undefined) setIdColony(undefined);
                else setIdColony(colonySelected.id_colony);
              }}
              onInputChange={(event, newInputValue) => { handlerColonySearch(newInputValue) }}
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
                id="combo-box-demo"
                onChange={(event: any, newValue: any) => {
                  const strategyLevelSelected: IStrategy|undefined = 
                  arrayStrategyLevel.find(strategyLevel => strategyLevel.role === newValue)
                  if(strategyLevelSelected===undefined) setIdStrategy(undefined);
                  else setIdStrategy(strategyLevelSelected.id_strategy);
                }}
                options={ arrayStrategyLevel.map((strategyLevel => strategyLevel.role)) }
                sx={{ width: 300 }}
                renderInput={(params) => <TextField {...params} label="Nivel jerarquico" />}
                />
            </div>
            <div className="flex mt-3 justify-center">
              <Autocomplete
                disablePortal
                id="combo-box-demo"
                onChange={(event: any, newValue: any) => {
                  const leaderSelected: IStructure|undefined = 
                  arrayLeader.find(leader => `${leader.first_name} ${leader.last_name}` === newValue);
                  if(leaderSelected===undefined) setIdLeader(undefined);
                  else setIdLeader(leaderSelected.id_member);
                }}
                onInputChange={(event, newInputValue) => { handlerSearchLeader(newInputValue) }}
                options={arrayLeader.map(leader => `${leader.first_name} ${leader.last_name}`)}
                sx={{ width: 300 }}
                renderInput={(params) => <TextField {...params} label="Lider" />}
                />
            </div>
            <div className="flex mt-3 justify-center">
              <Autocomplete
                disablePortal
                id="combo-box-demo"
                options={top100Films}
                sx={{ width: 300 }}
                renderInput={(params) => <TextField {...params} label="Seguidores" />}
                />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-row justify-center">
        <Button label="Aceptar"/>
      </div>
    </>
  )
}

export default FormPerson;