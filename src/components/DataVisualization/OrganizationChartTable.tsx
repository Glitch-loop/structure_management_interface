import { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { Tooltip } from '@mui/material';
import Button from '../UIcomponents/Button';
import { IStrategy, IRequest, IMember, IStructure } from '../../interfaces/interfaces';
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import requester from '../../helpers/Requester';
import { MdEditDocument } from 'react-icons/md';
import Searcher from '../UIcomponents/Searcher';
import MessageAlert from '../UIcomponents/MessageAlert';

const initialStrategy:IStrategy = {
  id_strategy: 0,
  zone_type: "",
  role: "",
  cardinality_level: 0
}

interface IMemberStrategyLevel extends IMember {
  number_follower: number;
  number_followers_structure: number;
  id_geographic_area: number;
  geographic_area_name: string;
}

const initialMemberStrategyLevel:IMemberStrategyLevel = {
  id_member: 0,
  first_name: "",
  last_name: "",
  street: "",
  ext_number: "",
  int_number: "", //address
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
  sectional_name: "",
  number_follower: 0,
  number_followers_structure: 0,
  id_geographic_area: 0,
  geographic_area_name: ""
}

const emptyMember: IMember = {
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
  birthday: "",
  ine: "",
  gender: 0,
  id_strategy: 0,
  colony_name: "",
  postal_code: "",
  id_sectional: 0,
  sectional_name: ""
}

const emptyMemberStrategicInformation:IStructure = {
  id_member: 0
}

//Auxiliar functions
const getLeaderRole = (id_strategy: number, arrayStrategyLevel: IStrategy[]):string => {
  const leaderLevel:IStrategy|undefined = arrayStrategyLevel.find(level => level.id_strategy === id_strategy);

  if(leaderLevel !== undefined) 
    return leaderLevel.role
  else return "";
  
}

const OrganizationChartTable = () => {

  const [arrayStrategyLevel, setArrayStrategyLevel] = useState<IStrategy[]>([]);
  const [currentLevel, setCurrentLevel] = useState<IStrategy>(initialStrategy);
  const [currentLeader, setCurrentLeader] = useState<IMemberStrategyLevel>(initialMemberStrategyLevel);
  const [membersCurrentLevel, setMemberCurrentLevel] = useState<IMemberStrategyLevel[]>([]);
  const [strategyLevelToSearch, setStrategyLevelToSearch] = useState<IStrategy>(initialStrategy);
  const [showMessageAlert, setShowMessageAlert] = useState<boolean>(false);
  const [memberSearched, setMemberSearched] = useState<string>("");
  //Reducers to alerts
  const dispatch:Dispatch<AnyAction> = useDispatch();
  const userData = useSelector((state: RootState) => state.userReducer)

  useEffect(() => {
    getStrategy().then(async (dataResponse) => {
      setArrayStrategyLevel(dataResponse);
      setCurrentLevel(dataResponse[0]);
      setMemberCurrentLevel( await searchStrategyLevelsFollowers(dataResponse[0].id_strategy, 0, ""));
    })
  }, []);

  //Calls to API
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

  const searchStrategyLevelsFollowers = async (idStrategy:number, idLeader:number, stringToSearch:string):Promise<IMemberStrategyLevel[]> => {
    const data:any = {
      "idStrategyLevel": idStrategy, 
      "idLeader": idLeader, 
      "stringToSearch": stringToSearch
    }
    try {
      const response: IRequest<IMemberStrategyLevel[]> = await requester({
        url: `/data/structure/strategyLevel`,
        method: 'POST',
        data: data
      })

      if(response.code === 200) 
        if(response.data !== undefined) 
          return response.data;
        
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar hacer la busqueda de los miembros de la estructura, intente mas tarde"}})); 
      return [];
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectar con el servidor, intente mas tarde"}})); 
      return [];
    }
  }

  const getBasicMemberInformationById = async(idMember: number):Promise<IMember> => {
    try {
      const response:IRequest<IMember[]> = await requester({
        url: `/members/${idMember}`,
        method: 'GET'
      });

      if(response.code === 200) 
        if(response.data !== undefined)
          return response.data[0];

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Hubo problemas al momento de obtener la informacion, intente nuevamente"}}));
      return emptyMember;
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return emptyMember;
    }
  }

  const getStrategicMemberInformation = async (idMember: number):Promise<IStructure> => {
    try {
      const response:IRequest<IStructure[]> = await requester({
        url: `/members/strategicInformation/${idMember}`
      })

      if(response.code === 200)
        if(response.data !== undefined)
          return response.data[0]

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Hubo problemas al momento de obtener la informacion estrategica del miembro, intente nuevamente"}}));
      return emptyMemberStrategicInformation;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return emptyMemberStrategicInformation;
    }
  }


  //Handlers
  const handleConsultFollowers = async(memberToConsult:IMemberStrategyLevel):Promise<void> => {
    //Reset states for searcher
    setMemberSearched("");
    setStrategyLevelToSearch(initialStrategy);

    if(memberToConsult.id_member !== undefined) {
      const { id_member } = memberToConsult;

      /* 
        From the "current" leader, get the level below (descending in the strategic
        level)
      */
      const nextStrategyLevel:IStrategy|undefined =
      arrayStrategyLevel
        .find(level => level.cardinality_level === currentLevel.cardinality_level + 1);
      
        
      if(nextStrategyLevel !== undefined) {
        setMemberCurrentLevel(
          await searchStrategyLevelsFollowers(nextStrategyLevel.id_strategy, id_member, ""));      
        setCurrentLevel(nextStrategyLevel);
        setCurrentLeader(memberToConsult);
      }
    }
  }

  const handleOnReturnLevel = async(memberToConsult:IMemberStrategyLevel):Promise<void> => {
    /* 
      From the "current" leader, get the level above (ascending in the strategic
      level)
    */
    const previousStrategyLevel:IStrategy|undefined = arrayStrategyLevel
      .find(level => level.cardinality_level === currentLevel.cardinality_level - 1);
      
    /*
        This "if" is to manage the case when the "current leader" doesn't have a leader and he doesn't have the
        highest heirarchical level.
        If it happens, then we break the function flow and send a message.
    */
    if(previousStrategyLevel !== undefined) {
      const { id_strategy, id_leader } = memberToConsult;
      if(currentLevel.cardinality_level - 1 !== 1 && id_leader === null){
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "El lider actual no tiene un lider, por lo que no se puede volver"}}));
        return;
      }
      /*
        Consult the followers of the leader of the current leader... 
        The leader now is a follower, so we search to him and his mates.
      */
      
      setMemberCurrentLevel(
        await searchStrategyLevelsFollowers(id_strategy, id_leader, ""));

      if(currentLevel.cardinality_level - 1 !== 1) {
        //Get basic information of the leader of the current leader
        const leaderBasicInformation:IMember = await getBasicMemberInformationById(id_leader);
  
        //Get strategic information of the leader of the current leader
        const leaderStrategicInformation:IStructure = await getStrategicMemberInformation(id_leader);
  
        const { geographic_area_name } = leaderStrategicInformation;
        
        const leader:IMemberStrategyLevel = {
          id_member: leaderBasicInformation.id_member,
          first_name: leaderBasicInformation.first_name,
          last_name: leaderBasicInformation.last_name,
          street: leaderBasicInformation.street,
          ext_number: leaderBasicInformation.ext_number,
          int_number: leaderBasicInformation.int_number, //address
          cell_phone_number: leaderBasicInformation.cell_phone_number,
          ine: leaderBasicInformation.ine,
          birthday: leaderBasicInformation.birthday,
          gender: 0,
          id_leader: leaderStrategicInformation.id_leader !== undefined ? leaderStrategicInformation.id_leader : 0,
          id_follower: [],
          id_colony: 0,
          id_strategy: leaderStrategicInformation.id_strategy !== undefined ?     leaderStrategicInformation.id_strategy : 0,
          colony_name: "",
          postal_code: "",
          id_sectional: 0,
          sectional_name: "",
          number_follower: 0,
          number_followers_structure: 0,
          id_geographic_area: 0,
          geographic_area_name: geographic_area_name!==undefined ? geographic_area_name : ""
        }
  
        setCurrentLeader(leader);
      } else {
        setCurrentLeader(initialMemberStrategyLevel);
      }

      setCurrentLevel(previousStrategyLevel);
    }
  }

  const handleSearchStrategyLevel = async (event: any, newInputValue: string | null) => {
    if (newInputValue !== null) {
      //Save the current search of the user
      setStrategyLevelToSearch({...strategyLevelToSearch, role: newInputValue});
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
      setStrategyLevelToSearch(initialStrategy)

    else { 
      setStrategyLevelToSearch({
        ...strategyLevelToSearch, 
        id_strategy: strategyLevelSelected.id_strategy,
        role: strategyLevelSelected.role,
      });
    }
  }

  const handleSearchPerson = async(personToSearch: string) => {
    setCurrentLeader(initialMemberStrategyLevel);
    const { id_strategy } = strategyLevelToSearch;
    if(id_strategy === 0) setShowMessageAlert(true);
    else {
      setShowMessageAlert(false)
      if(personToSearch !== "") {
        setMemberSearched(personToSearch);
        const followersFounded:IMemberStrategyLevel[] = 
          await searchStrategyLevelsFollowers(id_strategy, 0, personToSearch);
        
        //Save information
        const newLevel:IStrategy|undefined = arrayStrategyLevel.find(level => level.id_strategy === id_strategy);
        if(newLevel !== undefined) {
          setMemberCurrentLevel(followersFounded);
          setCurrentLevel(newLevel);
        }
      }
    }
  }

  const handleCancelSearching = async():Promise<void> => {
    setMemberCurrentLevel( await searchStrategyLevelsFollowers(arrayStrategyLevel[0].id_strategy, 0, ""));
    setMemberSearched("");
    setCurrentLeader(initialMemberStrategyLevel);
    setCurrentLevel(arrayStrategyLevel[0]);
    setStrategyLevelToSearch(initialStrategy);

  }   
  //Auxiliar functions
  const strategyLevelAutocompleteOptions = ():string[] => {
    const lastElementArray = arrayStrategyLevel.length - 1;
    const arrayToFilter:IStrategy[] = arrayStrategyLevel
      .filter(level => level.id_strategy !== arrayStrategyLevel[lastElementArray].id_strategy)
    return arrayToFilter.map((strategyLevel => strategyLevel.role)) 
  }
  
  return (
    <div className='flex flex-col'>
      <div className='flex flex-row justify-between'>
        <div className='flex basis-1/2 mx-3'>
          <Searcher 
            handleSearcher={handleSearchPerson}
            placeholder={"Buscar por nombre, telefono ó INE"}/>          
        </div>
        <div className='flex basis-1/2 justify-center mx-3'>
          <Autocomplete
            disablePortal
            id="input-strategy"
            onInputChange={(event: any, newInputValue: string | null) => 
              { handleSearchStrategyLevel(event, newInputValue) }}
            onChange={(event: any, newValue: string | null) => 
              handleSelectStrategyLevel(event, newValue) }
            value={ strategyLevelToSearch.role }
            options={ strategyLevelAutocompleteOptions() }
            sx={{ width: 300 }}
            renderInput={(params) => <TextField {...params} label="Nivel jerarquico" />}
            />
        </div>
      </div>
      {showMessageAlert && <MessageAlert label='Necesitas seleccionar un nivel jerarquico para poder hacer la busqueda'/> }
      {memberSearched !== "" && 
        <div className='flex flex-row items-center justify-between'>
          <p>
            Resultados encontrados para: <span>{memberSearched}</span>
          </p>
          <div className='mx-3'>
            <Button 
                label='Cancelar busqueda'
                colorButton={1}
                onClick={() => { handleCancelSearching() }}
                />
          </div>
        </div>
      }

      <div className='flex flex-row mb-3 justify-between'>
        <div className='flex flex-col'>
          {
            /*
              This labels are to indicate the leader's information, if we are at the
              first strategy level then it doesn't make sense show them (because 
              the members doesn't have a leader) 
            */
            arrayStrategyLevel[0] !== undefined &&
              (
                currentLevel.id_strategy !== arrayStrategyLevel[0].id_strategy &&
                memberSearched === "" && currentLeader.id_strategy !== 0
              ) && 
              <>
                <p>Lider: 
                  <span className='ml-2 italic font-bold'>
                    {currentLeader.first_name} {currentLeader.last_name}
                  </span>
                </p>
                <p className='mt-3'> Nivel jerarquico del lider: 
                  <span className='ml-2 italic font-bold'>
                    { getLeaderRole(currentLeader.id_strategy, arrayStrategyLevel) }
                  </span>
                </p>
                <p>
                  Area geografica que administra: 
                  <span className='ml-2 italic font-bold'>
                      {currentLeader.geographic_area_name===null ? "No administra area geografica" : currentLeader.geographic_area_name}
                  </span>
                </p>
                <p>
                  Dirección: 
                  <span className='ml-2 italic font-bold'>
                    {currentLeader.street} #{currentLeader.ext_number}, {currentLeader.colony_name}
                  </span>
                </p>
              </>
          }
          {
            arrayStrategyLevel[0] !== undefined &&
            <p className='mt-3'> Nivel jerarquico actual: 
              <span className='ml-2 italic font-bold'>
                { currentLevel.role }
              </span>
            </p>
          }
          { 
            /*
              Adding a label to indicate to the user that he is in 
              the last strategy level 
            */
            arrayStrategyLevel[0] !== undefined &&
              (currentLevel.id_strategy === 
              arrayStrategyLevel[arrayStrategyLevel.length - 1].id_strategy) &&
              <p className='italic ml-3 my-1'>Ultimo nivel de la estrategia</p>
          }
        </div>
        <div>
          {
            arrayStrategyLevel[0] !== undefined &&
            (
              currentLevel.id_strategy !== arrayStrategyLevel[0].id_strategy 
              && memberSearched === ""
            ) && 
              <Button 
              label='Volver'
              onClick={() => { handleOnReturnLevel(currentLeader) }}
              />
          }
        </div>
      </div>
      { membersCurrentLevel[0] === undefined ?
        <div className='flex justify-center my-5'>
          { memberSearched === "" ?
            <CircularProgress /> : 
            <p>No se encontraron coincidencias para tu busqueda</p>
          }
        </div>
        :
        <Paper sx={{overflow: 'hidden'}}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="center">ID</TableCell>
                  <TableCell align="center">Nombre</TableCell>
                  <TableCell align="center">Telefono</TableCell> 
                  <TableCell align="center">INE</TableCell> 
                  <TableCell align="center">Dirección</TableCell>
                  <TableCell align="center">Area geográfica</TableCell>
                  <TableCell align="center">Cantidad total de seguidores</TableCell>
                  <TableCell align="center">Seguidores directos</TableCell>
                  <TableCell align="center">Ver</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { 
                  membersCurrentLevel.map(person => {
                    return (
                      <TableRow key={person.id_member}>
                        <TableCell align="center">
                          {person.id_member}
                        </TableCell>
                        <TableCell align="center">
                          {person.first_name} {person.last_name}
                        </TableCell>
                        <TableCell align="center">
                          {person.cell_phone_number}
                        </TableCell>
                        <TableCell align="center">
                          {person.ine}
                        </TableCell>
                        <TableCell align="center">
                            {person.street} #{person.ext_number}, {person.colony_name}
                        </TableCell>
                        <TableCell align="center">
                          {person.geographic_area_name === null ?
                          "No administra ninguna" : person.geographic_area_name}
                        </TableCell>
                        <TableCell align="center">
                          { person.number_followers_structure - 1 }
                        </TableCell>
                        <TableCell align="center">
                          {person.number_follower === null ? 
                            0 : person.number_follower}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Editar">
                            {/* Add validation when the user doesn't have followers */}
                            <button
                            onClick={() => {
                              if( person.number_follower !== null) 
                                handleConsultFollowers(person);                            
                              }
                            }
                            className={
                              person.number_follower === null ? "text-2xl opacity-50" : "text-2xl opacity-100"}>
                                <MdEditDocument  />
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
      }
    </div>
  )
}


export default OrganizationChartTable;