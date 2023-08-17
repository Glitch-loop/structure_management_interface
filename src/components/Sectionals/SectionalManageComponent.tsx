import { useState, useEffect } from 'react'
import { ISectional, IRequest, IStrategy, IMember } from "../../interfaces/interfaces"
import SearchSectionals from "../Searchers/SearchSectionals"
import Button from '../UIcomponents/Button';
import Input from '../UIcomponents/Input';
import { avoidNull, getPercentage } from '../../utils/utils';
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch } from 'react-redux';
import requester from '../../helpers/Requester';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import StrategyAutocomplete from '../Autocompletes/StrategyAutocomplete';
import SearchMember from '../Searchers/SearchMember';

const responseError:IRequest<undefined> = {
  message: "Internal error",
  data: undefined,
  code: 500
}

const SectionalManageComponent = () => {
  // Operational state
  const [ sectionalSelected, setSectionalSelected ] = 
    useState<ISectional|undefined>(undefined);

  // Data analytics state
  const [ sectionalsOverview, setSectionalsOverview ] = 
    useState<ISectional[]|undefined>(undefined);
  const [ generalMembersObjetive, setGeneralMembersObjetive ] = useState<number[]>([]);
  const [ strategyLevelSelectedSD, setStrategyLevelSelectedSD ] = useState<IStrategy|undefined>(undefined);
  const [ sectionalSelectedSD, setSectionalSelectedSD ] = useState<ISectional|undefined>(undefined);
  const [ dataSectionalDistribution, setDataSectionalDistribution ] = useState<any[]>([]);
  const [ dataLeaderFollowersSectionals, setDataLeaderFollowersSectionals ] = useState<any[]>([]);


  const dispatch:Dispatch<AnyAction> = useDispatch();
  
  useEffect(() => {
    getAllSectionals().then(response => {
      //Get general objetive
      let targetMembers = 0;
      let currentMembers = 0;
      response.forEach(sectional => {
        if(sectional.target_members !== undefined)
          targetMembers += sectional.target_members;
        
        if(sectional.current_members !== undefined)
          currentMembers += sectional.current_members;
      });

      //Store values
      setGeneralMembersObjetive([
        targetMembers,
        currentMembers,
        Math.floor(getPercentage(targetMembers, currentMembers))
      ]);

      setSectionalsOverview(response);
    });
  }, []);

  //API calls
  // Operational calls
  const updateSectional = async (sectional: ISectional):Promise<IRequest<undefined>> => {
    try {
      const data = {
        sectionalAdress: sectional.sectional_address,
        membersTarget: sectionalSelected?.target_members

      }

      const response:IRequest<undefined> = await requester({
        url: `/sectionals/${sectional.id_sectional}`,
        method: 'PUT',
        data
      })
      
      if(response.code === 200) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.success, 
          message: "Se ha actualizado el seccional correctamente"}}));  
      }
      if(response.code === 400) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "Ha habido un error al intentar actualizar el seccional, intente nuevamente"}}));  
      }
        return response;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
        return responseError;
    }
  }

  // Data calls
  const getAllSectionals = async():Promise<ISectional[]> => {
    try {
      const response:IRequest<ISectional[]> = await requester({
        url: `/sectionals/`})
      if(response.code === 200)
        if(response.data !== undefined) 
          return response.data;

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Ha habido un problema al intentar obtener los seccionales, intente nuevamente"}}));  
      return [];
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return [];
    }
  }

  const getSectionalDistributionLeaders = async(idSeccional: number, idStrategy: number):Promise<any[]> => {
    try {
      const response:IRequest<ISectional[]> = await requester({
        url: `/sectionals/leaders/${idSeccional}/${idStrategy}`})
      if(response.code === 200)
        if(response.data !== undefined) 
          return response.data;

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Ha habido un problema consultar la información del seccional, intente nuevamente"}}));  
      return [];
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return [];
    }    
  }

  const getFollowersDistributionOfLeader = async (idMember:number) => {
    try {
      const response:IRequest<ISectional[]> = await requester({
        url: `/sectionals/leaders/${idMember}`})
      if(response.code === 200)
        if(response.data !== undefined) 
          return response.data;

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Ha habido un problema consultar la información del miembro, intente nuevamente"}}));  
      return [];
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return [];
    }  
  }

  //Handlers
  const onSelectSectional = async (sectional: ISectional):Promise<void> => {
    // Avoid null values
    sectional.sectional_address = avoidNull(sectional.sectional_address, "");
    sectional.target_members = avoidNull(sectional.target_members, 0);
    
    setSectionalSelected(sectional)
  }

  const onUpdateSectional = async ():Promise<void> => {
    if(sectionalSelected !== undefined) {
      const response:IRequest<undefined> = await updateSectional(sectionalSelected);

      if(response.code === 200) {
        console.log(sectionalSelected)
        setSectionalSelected(undefined);
      }
    }
  }

  const onSelectSectionalSD = async(sectional:ISectional|undefined):Promise<void> => {
    if(sectional !== undefined) {
      setSectionalSelectedSD(sectional);
      if(strategyLevelSelectedSD !== undefined) {
        getSectionalDistributionLeaders(sectional.id_sectional, 
          strategyLevelSelectedSD.id_strategy)
          .then(response => {
            setDataSectionalDistribution(response)
          })
      }
    }
  }

  const onSelectStrategySD = async(strategyLevel:IStrategy|undefined):Promise<void> => {
    if(strategyLevel !== undefined) {
      setStrategyLevelSelectedSD(strategyLevel);
      if(sectionalSelectedSD !== undefined) {
        getSectionalDistributionLeaders(sectionalSelectedSD.id_sectional, 
          strategyLevel.id_strategy)
          .then(response => {
            setDataSectionalDistribution(response)
          })
      }
    }
  }

  const onSearchMember = async(member:IMember|undefined) => {
    if(member !== undefined) {
      if(member.id_member !== undefined) {
        getFollowersDistributionOfLeader(member.id_member)
        .then(response => setDataLeaderFollowersSectionals(response));
      }
    }
  }


  return (
    <>
      <div className='flex flex-row items-center'>
        <div className='mr-3'>
          <div>
            <SearchSectionals onSelectItem={onSelectSectional}/>
            { sectionalSelected !== undefined && 
            <div className='flex justify-center'>
              <div className="flex flex-col w-72 justify-center">
                <div className="mr-2">
                  <Input
                    onType={setSectionalSelected}
                    objectValue={sectionalSelected} 
                    inputName={"sectional_address"}
                    placeholder={'Dirección de casilla'}
                    inputType={'text'}
                    required={true}
                  />
                </div>
                <Input
                  onType={setSectionalSelected}
                  objectValue={sectionalSelected} 
                  inputName={"target_members"}
                  placeholder={'Miembros objetivo a tener'}
                  inputType={'text'}
                  testRegex={new RegExp(/^\d*$/, 's')}
                  testMessage={"Debe de ser un numero"}
                />

                <Button 
                  label={'Actualizar'}
                  onClick={onUpdateSectional}
                  style={'m-3'}
                />
              </div>
            </div>
            }
          </div>
          <div className='my-6'>
            <p className='mb-3 text-center'>
              Distribución de lideres en seccional
            </p>
            { dataSectionalDistribution[0]!== undefined &&
              <div className='flex flex-row justify-around mb-3'>
                <p>Miembros objetivo: { dataSectionalDistribution[0].target_members } </p>
                <p>Miembros actuales: { dataSectionalDistribution[0].currrent_members } </p>
              </div>
            }
            <div className='flex flex-row'>
              <SearchSectionals onSelectItem={ onSelectSectionalSD }/>
              <div className='ml-3'>
                <StrategyAutocomplete onSelect={ onSelectStrategySD }/>
              </div>
            </div>
            { dataSectionalDistribution[0] !== undefined &&
              <>
                { dataSectionalDistribution[0].leaders !== undefined &&
                  <Paper sx={{overflow: 'hidden'}}>
                    <TableContainer sx={{ maxHeight: 200 }}>
                      <Table >
                        <TableHead>
                          <TableRow>
                            <TableCell align="center">Nombre lider</TableCell>
                            <TableCell align="center">Seguidores en el seccional</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {
                            dataSectionalDistribution[0].leaders.map((leader:any) => {
                              return (
                                <TableRow key={ leader.idMember }>
                                  <TableCell align="center">
                                    { leader.first_name } { leader.last_name }
                                  </TableCell>
                                  <TableCell align="center">
                                    {leader.current_member_sectional}
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
              </>
            }
        </div>
        </div>
        <div>
          <div>
            <p className='mb-3 text-center'>
              Total todos los seccionales
            </p>
            <div className='flex flex-row justify-around mb-3'>
              <p>Meta lograda:  {generalMembersObjetive[1]}/{generalMembersObjetive[0]} (miembros)</p>
              <p>Progreso: {generalMembersObjetive[2]}%</p>
            </div>
            { sectionalsOverview !== undefined &&
              <Paper sx={{overflow: 'hidden'}}>
                  <TableContainer sx={{ maxHeight: 200 }}>
                    <Table >
                      <TableHead>
                        <TableRow>
                          <TableCell align="center">Seccional</TableCell>
                          <TableCell align="center">Miembros objetivo</TableCell>
                          <TableCell align="center">Miembros actuales</TableCell>
                          <TableCell align="center">Porcentaje de objetivo</TableCell> 
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {
                          sectionalsOverview.map(sectional => {
                            return (
                              <TableRow key={sectional.id_sectional}>
                                <TableCell align="center">
                                  {sectional.sectional_name}
                                </TableCell>
                                <TableCell align="center">
                                  {sectional.target_members}
                                </TableCell>
                                <TableCell align="center">
                                  {sectional.current_members}
                                </TableCell>
                                <TableCell align="center">
                                  {sectional.goal_percentage}%
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
          <div className='mt-3'>
            <p className='mb-3 text-center'>
              Distribucion de seguidores entre seccionales de un líder
            </p>
            <SearchMember onSelectItem={onSearchMember} />
            { dataLeaderFollowersSectionals[0] !== undefined &&
              <Paper sx={{overflow: 'hidden'}}>
                <TableContainer sx={{ maxHeight: 200 }}>
                  <Table >
                    <TableHead>
                      <TableRow>
                        <TableCell align="center">Seccional</TableCell>
                        <TableCell align="center">Miembros objetivo</TableCell>
                        <TableCell align="center">Miembros actuales</TableCell>
                        <TableCell align="center">Cantidad de seguidores</TableCell> 
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {
                        dataLeaderFollowersSectionals.map((sectional:any) => {
                          return (
                            <TableRow key={ sectional.id_sectional }>
                              <TableCell align="center">
                                { sectional.sectional_name }
                              </TableCell>
                              <TableCell align="center">
                                {sectional.target_members}
                              </TableCell>
                              <TableCell align="center">
                                {sectional.current_members}
                              </TableCell>
                              <TableCell align="center">
                                {sectional.amount_followers}
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
          
        </div>
      </div>
    </>
  )
}

export default SectionalManageComponent
