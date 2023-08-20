import { useState, useEffect } from 'react'
import { ISectional, IRequest, IStrategy, IMember, IStructure } from "../../interfaces/interfaces"
import SearchSectionals from "../Searchers/SearchSectionals"
import Button from '../UIcomponents/Button';
import { getPercentage } from '../../utils/utils';
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
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import MessageAlert from '../UIcomponents/MessageAlert';

interface ISecctionalReport extends ISectional {
  followers: IMember[];
}

interface IReportSectionals extends IMember {
  leaderReport: ISecctionalReport[];
} 

const SectionalAnalysisComponent = () => {
  const responseError:IRequest<undefined> = {
    message: "Internal error",
    data: undefined,
    code: 500
  }

    // Data analytics state
    const [ sectionalsOverview, setSectionalsOverview ] = 
    useState<ISectional[]|undefined>(undefined);
  const [ generalMembersObjetive, setGeneralMembersObjetive ] = useState<number[]>([]);
  const [ strategyLevelSelectedSD, setStrategyLevelSelectedSD ] = useState<IStrategy|undefined>(undefined);
  const [ sectionalSelectedSD, setSectionalSelectedSD ] = useState<ISectional|undefined>(undefined);
  const [ dataSectionalDistribution, setDataSectionalDistribution ] = useState<any[]|undefined>([]);
  const [ dataLeaderFollowersSectionals, setDataLeaderFollowersSectionals ] = useState<any[]>([]);
  const [ strategyLevelToGenerateReport, setStrategyLevelToGenerateReport ] = useState<IStrategy|undefined>(undefined);
  const [ leaderToGenerateReport, setLeaderToGenerateReport ] = useState<IStructure|undefined>(undefined);
  const [reportErrorStrateLevel, setReportErrorStrateLevel] = useState<boolean>(false);
  const [reportErrorMember, setReportErrorMember] = useState<boolean>(false);

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

  const getReportFollowersBySectional = async (idStrategy:number):Promise<IReportSectionals[]> => {
    try {
      const response:IRequest<IReportSectionals[]> = await requester({
        url: `/sectionals/report/members/${idStrategy}`})
      
      if(response.code === 200)
        if(response.data !== undefined) 
          return response.data;
      
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Ha habido un problema al intentar obtener la información, intente nuevamente"}}));  
      return [];
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return [];
    }
  }

  //Handlers 
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
        console.log("sectionalSelectedSD: ", sectionalSelectedSD)
        console.log("strategyLevel: ", strategyLevel)
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

  const handleDownloadByStrategyLevel = async ():Promise<void> => {
    console.log(strategyLevelToGenerateReport)
    if(strategyLevelToGenerateReport === undefined) {
      setReportErrorStrateLevel(true);
      console.log("no")
    } else {
      console.log("ok")
      setReportErrorStrateLevel(false);
  
      const responsLeaders:IReportSectionals[] = 
        await getReportFollowersBySectional(strategyLevelToGenerateReport.id_strategy);
  
      const zip = new JSZip();

      
      //Iteration for leaders
      for(let i = 0; i < responsLeaders.length; i++) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet 1');

        const currentLeader = responsLeaders[i];
        //Header for the leader
        if(i > 0 ) {
          worksheet.addRow([``]);  
        }
        const leaderRows = worksheet.addRow(["Lider: ",`${currentLeader.first_name} ${currentLeader.last_name}`]);  
  
        leaderRows.font = { bold: true, size: 16 }
        leaderRows.alignment = { horizontal: 'center' }
  
        //Iteration for secctionals where the leader has followers
        for(let j = 0; j < currentLeader.leaderReport.length; j++) {
          const currentSectional = currentLeader.leaderReport[j]
          
          if(currentSectional.sectional_address === undefined 
            || currentSectional.sectional_address === null 
            || currentSectional.sectional_address === "") 
            currentSectional.sectional_address = "Aún no han registrado la direccion del seccional";
          
          const sectionalRows = worksheet.addRow([
            currentSectional.sectional_name, 
            currentSectional.sectional_address
          ]);
  
          sectionalRows.font = { bold: true, size: 14 };
          sectionalRows.alignment = { horizontal: 'center' };
  
          // Iteration for followers in the sectional
          for(let k = 0; k < currentSectional.followers.length; k++) {
            const currentFollower = currentSectional.followers[k];
            worksheet.addRow([
              `${currentFollower.first_name} ${currentFollower.last_name}`, 
              currentFollower.cell_phone_number,
              currentFollower.ine
            ]);
          }
        }

        // Add excel to zip
        const excelBuffer = await workbook.xlsx.writeBuffer();
        zip.file(`${currentLeader.first_name}_${currentLeader.last_name}_seccionales.xlsx`, excelBuffer);
      }
      
  
      // Create a Blob object and trigger the download
      const zipBlob = await zip.generateAsync({type: 'blob'})
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'seguidores_por_seccional_de_cada_lider.zip';
      link.click();
      URL.revokeObjectURL(url);
    }
  };



  return (
    <>
      <div className='flex flex-row'>
      {/* Sectionals overview */}
      <div className='flex flex-col'>
        <div className='flex flex-col mb-6'>
          <span className='text-center font-bold mb-3'>Descargar por nivel jerarquíco</span>
          <div className='flex flex-row justify-around'>
            <StrategyAutocomplete onSelect={setStrategyLevelToGenerateReport}/>
            <Button label='Descargar' onClick={handleDownloadByStrategyLevel}/>
          </div>
          { reportErrorStrateLevel && <MessageAlert label='Tienes que escoger un nivel jeraquico'/>}
          <span className='text-center font-bold mb-3 mt-6'>Descargar por lider</span>
          <div className='flex flex-row justify-around'>
            <SearchMember onSelectItem={setStrategyLevelToGenerateReport}/>
            {/* <Button onClick={handleDownload} label='Descargar'/> */}
          </div>
        </div>
        <div>
          <p className='mb-3 text-center font-bold'>
            Total todos los seccionales
          </p>
          <div className='flex flex-row justify-around mb-3'>
            <p>Meta lograda:  {generalMembersObjetive[1]}/{generalMembersObjetive[0]} (miembros)</p>
            <p>Progreso: {generalMembersObjetive[2]}%</p>
          </div>
          { sectionalsOverview !== undefined &&
            <Paper sx={{overflow: 'hidden'}}>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table >
                    <TableHead>
                      <TableRow>
                        <TableCell align="center">
                          <span className='font-bold'>
                            Seccional
                          </span>
                        </TableCell>
                        <TableCell align="center">
                          <span className='font-bold'>
                            Miembros objetivo
                          </span>
                        </TableCell>
                        <TableCell align="center">
                          <span className='font-bold'>
                            Miembros actuales
                          </span>
                        </TableCell>
                        <TableCell align="center">
                          <span className='font-bold'>
                            Porcentaje de objetivo
                          </span>
                        </TableCell> 
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
      </div>
      <div className='ml-6 flex flex-col'>
        <div className='my-6'>
          <p className='mb-3 text-center font-bold'>
            Distribución de lideres en seccional
          </p>
          <div className='flex flex-col justify-center'>
            <SearchSectionals onSelectItem={ onSelectSectionalSD }/>
            <div className='my-3 flex justify-center'>
              <StrategyAutocomplete onSelect={ onSelectStrategySD }/>
            </div>
          </div>
          { dataSectionalDistribution !== undefined &&
            <>     
              { dataSectionalDistribution[0] !== undefined &&
                <>
                  <div className='flex flex-row justify-around my-3'>
                    <p>Miembros objetivo: { dataSectionalDistribution[0].target_members }</p>
                    <p>Miembros actuales: 
                      { 
                        dataSectionalDistribution[0].currrent_members===undefined ? 0 : dataSectionalDistribution[0].currrent_members
                      }
                    </p>
                  </div>
                  { dataSectionalDistribution[0].leaders[0] !== undefined ?
                    <Paper sx={{overflow: 'hidden'}}>
                      <TableContainer sx={{ maxHeight: 200 }}>
                        <Table >
                          <TableHead>
                            <TableRow>
                              <TableCell align="center">
                                <span className='font-bold'>
                                  Nombre lider
                                </span>
                              </TableCell>
                              <TableCell align="center">
                                <span className='font-bold'>
                                  Seguidores en el seccional
                                </span>
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {
                              dataSectionalDistribution[0].leaders.map((leader:any) => {
                                return (
                                  <TableRow key={ leader.id_member }>
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
                    </Paper> :
                    <p className='text-center mt-3 font-bold'>El seccional no tiene miembros aún.</p>
                  }
                </>
              }
            </>
          }
        </div>
        <div className='mt-3'>
          <p className='mb-3 text-center font-bold'>
            Distribucion de seguidores entre seccionales de un líder
          </p>
          <div className='my-3'>
            <SearchMember onSelectItem={onSearchMember} />
          </div>
          { dataLeaderFollowersSectionals[0] !== undefined &&
            <Paper sx={{overflow: 'hidden'}}>
              <TableContainer sx={{ maxHeight: 200, maxWidth: 600 }}>
                <Table >
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">
                        <span className='font-bold'>
                          Seccional
                        </span>
                      </TableCell>
                      <TableCell align="center">
                        <span className='font-bold'>
                          Miembros objetivo
                        </span>
                      </TableCell>
                      <TableCell align="center">
                        <span className='font-bold'>
                          Miembros actuales en seccional
                        </span>
                      </TableCell>
                      <TableCell align="center">
                        <span className='font-bold'>
                          Cantidad de seguidores de lider en el seccional (contando al lider)
                        </span>
                      </TableCell> 
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

export default SectionalAnalysisComponent;