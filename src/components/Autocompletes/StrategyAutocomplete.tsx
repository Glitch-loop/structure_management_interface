import { useEffect, useState } from 'react';
import { Autocomplete, TextField } from "@mui/material";
import requester from "../../helpers/Requester";
import { IStrategy, IRequest } from "../../interfaces/interfaces";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch } from 'react-redux';
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";

const StrategyAutocomplete = ({onSelect}:{onSelect:any}) => {
  const [arrayStrategyLevel, setArrayStrategyLevel] = useState<IStrategy[]>([]);
  const [searchStrategyLevelStructure, setSearchStrategyLevelStructure] = useState<string>("");


  //Use context
  const dispatch:Dispatch<AnyAction> = useDispatch();

  useEffect(() => {
    getStrategy()
    .then((dataStrategyLevels:IStrategy[]) => {
      dataStrategyLevels.pop();
      setArrayStrategyLevel(dataStrategyLevels);
    });
  }, [])

  //Call to API
  const getStrategy = async():Promise<IStrategy[]> => {
    try {
      const response:IRequest<IStrategy[]> = await requester({
        url: `/strategyLevels`,
        method: 'GET'
      })

      if(response.code === 200)
        if(response.data !== undefined) {
          return response.data;
        }

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Ha habido un problema al intentar obtener los niveles de la estrategia, intente nuevamente"}}));  
      return [];
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return [];
    }
  }

  //Handlers
  const handleSearchStrategyLevelStructure = async (event: any, newInputValue: string | null) => {
    if (newInputValue !== null) 
      if(newInputValue!=="") setSearchStrategyLevelStructure(newInputValue)
  }

  const handleSelectStrategyLevelStructure = async (event: any, newValue: string | null) => {
    const strategyLevelSelected: IStrategy|undefined = 
    arrayStrategyLevel.find(strategyLevel => strategyLevel.role === newValue);
    if(strategyLevelSelected !== undefined) {
      onSelect(strategyLevelSelected);
    }
  }


  return (
    <Autocomplete
    disablePortal
    id="input-strategy"
    onInputChange={(event: any, newInputValue: string | null) => 
      { handleSearchStrategyLevelStructure(event, newInputValue) }}
    onChange={(event: any, newValue: string | null) => 
      handleSelectStrategyLevelStructure(event, newValue) }
    value={
      searchStrategyLevelStructure
    }
    options={ arrayStrategyLevel.map((strategyLevel => strategyLevel.role)) }
    sx={{ width: 300 }}
    renderInput={(params) => <TextField {...params} label="Nivel jerárquico" />}
    />
  )
}

export default StrategyAutocomplete;