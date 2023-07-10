import { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Tooltip } from '@mui/material';
import Button from '../UIcomponents/Button';
import { IStrategy, IRequest, IMember } from '../../interfaces/interfaces';
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import requester from '../../helpers/Requester';
import { MdEditDocument } from 'react-icons/md';

const initialStrategy:IStrategy = {
  id_strategy: 0,
  zone_type: "",
  role: "",
  cardinality_level: 0
}

interface IMemberStrategyLevel extends IMember {
  number_follower: number;
  id_geographic_area: number;
  geographic_area_name: string;
}

const OrganizationChartTable = () => {

  const [arrayStrategyLevel, setArrayStrategyLevel] = useState<IStrategy[]>([]);
  const [currentLevel, setCurrentLevel] = useState<IStrategy>(initialStrategy);
  const [membersCurrentLevel, setMemberCurrentLevel] = useState<IMemberStrategyLevel[]>([]);
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
        url: `/data/structure/strategyLevel/followers`,
        method: 'POST',
        data: data
      })
      
      console.log(response)
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

  return (
    <div className='flex flex-col'>
      <div className='flex flex-row mb-3 justify-between'>
        <div className='flex flex-col'>
          <p>Lider: </p>
          <p>Nivel jerarquico: </p>
          <p>Area geografica que administra: </p>
        </div>
        <div className=''>
          <Button label='Volver'/>
        </div>
      </div>
      <Paper sx={{overflow: 'hidden'}}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">ID</TableCell>
                <TableCell align="center">Nombre</TableCell>
                <TableCell align="center">Telefono</TableCell> 
                <TableCell align="center">INE</TableCell> 
                <TableCell align="center">Area geográfica</TableCell> 
                <TableCell align="center">No. seguidores</TableCell>
                <TableCell align="center">Seguidores</TableCell>
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
                        {person.geographic_area_name === null ?
                        "No administra ninguna" : person.geographic_area_name}
                      </TableCell>
                      <TableCell align="center">
                        {person.number_follower === null ? 
                          0 : person.number_follower}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <button
                          onClick={() => 
                            console.log("Hola")
                            // {handleOnUpdate(person.id_member)}
                          }
                          className="text-2xl">
                            <MdEditDocument />
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
    </div>
  )
}


export default OrganizationChartTable;