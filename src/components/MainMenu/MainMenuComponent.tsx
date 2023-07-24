import { useEffect, useState } from "react";
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import requester from "../../helpers/Requester";
import { IGeographicArea, IMember, IRequest, IStructure } from "../../interfaces/interfaces";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Tooltip, Autocomplete, TextField } from "@mui/material";
import { MdEditDocument } from "react-icons/md";
import { BsCheckCircle } from "react-icons/bs";
import { MdErrorOutline } from "react-icons/md";
import FormPerson from "../FormPersons/FormPerson";
import { Chart as ChartJS, Legend, Tooltip as TooltipChart } from 'chart.js'; //Chart in general
import { ArcElement,  } from 'chart.js'; //Pie chart
import { CategoryScale, LinearScale, BarElement, Title } from 'chart.js'; //Pie chart
import { Pie } from "react-chartjs-2";
import { Bar } from 'react-chartjs-2';
import { createRGBColor } from "../../utils/utils";
import { IStrategy } from "../../interfaces/interfaces";

ChartJS.register(ArcElement, TooltipChart, Legend); // Register for Pie Chart
ChartJS.register( CategoryScale, LinearScale, BarElement, Title, TooltipChart, Legend); // Register for Bar chart

const errorResponse:IRequest<any> = {
  code: 500,
  data: undefined,
  message: "error"
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
  postal_code: ""
}

//Configuration for age histogram
const histogramOptions = {
  plugins: {
    title: {
      display: true,
      text: 'Histograma de edades de la estructura',
    },
  },
  responsive: true,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  scales: {
    x: {
      stacked: true,
    },
    y: {
      stacked: true,
    },
  },
};

interface IGeographicAreaManage extends IGeographicArea {
  first_name: string;
  last_name: string;
}  

const emptyMemberStrategicInformation:IStructure = {
  id_member: 0
}


interface IMemberProfileIncomplete extends IMember {
  id_geographic_area: number;
}

interface IMemberRankingStructure extends IMember {
  followers: number
}

const MainMenuComponent = () => {

  //Privileges states
  const [updateMemberPrivilege, setUpdatePrivilege] = useState<boolean>(false);
  const [updateGeographicAreaPrivilege, setUpdateGeographicAreaPrivilege] = useState<boolean>(false);
  const [allStructureCountPrivilege, setAllStructureCountPrivilege] = useState<boolean>(false);
  const [histogramAgesStructurePrivilege, setHistogramAgesStructurePrivilege] = useState<boolean>(false);
  const [rankingColoniesPrivilege, setRankingColoniesPrivilege] = useState<boolean>(false);
  const [rankingLeadersPrivilege, setRankingLeadersPrivilege] = useState<boolean>(false);

  const [incompleteMembersProfile, setIncompleteMembersProfile] = useState<IMemberProfileIncomplete[]>([]);
  const [incompleteGeographicAreasInformation, setIncompleteGeographicAreasInformation] = useState<IGeographicAreaManage[]>([]);

  const [memberBasicInfoToUpdate, setMemberBasicInfoToUpdate] = useState<IMember>();
  const [memberStrategicInfoToUpdate, setMemberStrategicInfoToUpdate] = useState<IStructure>();
  const [showForm, setShowForm] = useState<boolean>(false);
  
  //Charts states
  const [totalAmountDataChart, setTotalAmountDataChart] = useState<number[]>([]);
  const [membersAgeDataHistogram, setMembersAgeDataHistogram] = useState<any>(undefined);
  const [extraDataHistogram, setExtraDataHistogram] = useState<any>(undefined);
  const [rankingColonies, setRankingColonies] = useState<any[]>([]);
  const [rankingMemberStructure, setMemberStructure] = useState<IMemberRankingStructure[]>([]);

  //Operational 
  const [arrayStrategyLevel, setArrayStrategyLevel] = useState<IStrategy[]>([]);
  const [searchStrategyLevelStructure, setSearchStrategyLevelStructure] = useState<string>("");
  const [searchStrategyLevelColony, setSearchStrategyLevelColony] = useState<string>("");

  //Reducers for alerts message
  const dispatch:Dispatch<AnyAction> = useDispatch();
  const userData = useSelector((state: RootState) => state.userReducer);

  useEffect(() => {
    // Get privilege colony ranking
    requester({url: '/privileges/user/[22]', method: "GET"})
    .then(response => {
      setRankingColoniesPrivilege(response.data.privilege);
    });
    // Get privilege leader ranking
    requester({url: '/privileges/user/[23]', method: "GET"})
    .then(response => {
      setRankingLeadersPrivilege(response.data.privilege);
    });
    getMembersWithoutCompleteInformation()
      .then(response => {
        let {data, code} = response;
        if(code !== 403) setUpdatePrivilege(true);
        if(data !== undefined) setIncompleteMembersProfile(data);    
      });
    getGeographicAreasWithoutCompleteInformation()
      .then(response => {
        const { data, code } = response;
        if(code !== 403) setUpdateGeographicAreaPrivilege(true);
        if(data !== undefined) setIncompleteGeographicAreasInformation(data);
      });
    getCountAllStructure()
      .then(response => {
        const {code, data} = response;
        if(code !== 403) setAllStructureCountPrivilege(true);
        setTotalAmountDataChart([data.amount_male, data.amount_female]);
      });
    getAgeHistogram()
      .then(responseDB => {
        const response = responseDB.data;
        const {code} = responseDB;
        if(code !== 403) setHistogramAgesStructurePrivilege(true);
        if(response !== undefined) {
          setExtraDataHistogram({
            "youngestAge": response.youngest_age,
            "oldestAge": response.oldest_age
          })

          
          const labels:any[] = [];
          const data:any[] = [];
          const bgColor:any[] = [];
          const bColor:any[] = [];

          if(response.histogram[0] !== undefined) {
            const { histogram } = response;
            histogram.forEach((ageRange:any, index:number) => {
              data.push(ageRange.number_member);
              const color = createRGBColor(255,200,192)
              bgColor.push(`rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.2)`)
              bColor.push(`rgba(${color[0]}, ${color[1]}, ${color[2]})`)
              
              if(index === histogram.length - 1) 
                labels.push(`${ageRange.init_age} - ${ageRange.last_age}+`);
              else 
                labels.push(`${ageRange.init_age} - ${ageRange.last_age}`);
            })
          }

          setMembersAgeDataHistogram({
            labels: labels,
            datasets: [{
              label: 'Numero de miembros',
              data: data,
              backgroundColor: bgColor,
              borderColor: bColor,
              borderWidth: 1
            }]
          })
        }
      });
    getStrategy()
      .then((dataStrategyLevels:IStrategy[]) => {
        dataStrategyLevels.pop();
        setArrayStrategyLevel(dataStrategyLevels);
      });
  }, [])

  //Request to API
  const getMembersWithoutCompleteInformation = async():Promise<IRequest<IMemberProfileIncomplete[]>> => {
    errorResponse.data = [];

    try {
      const response:IRequest<IMemberProfileIncomplete[]> = await requester({
        url: `/members/profile/incomplete`,
        method: 'GET'
      })

      if(response.code === 200)
        if(response.data !== undefined)
          return response;

      if(response.code === 400) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "Hubo un error al intentar obtener los miembros con información completa"}}));
      }

      response.data = [];
      return response;
        
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectar con el servidor"}}));
      
      return errorResponse;
    }
  }

  const getGeographicAreasWithoutCompleteInformation = async():Promise<IRequest<IGeographicAreaManage[]>> => {
    try {
      errorResponse.data = [];
      const response:IRequest<IGeographicAreaManage[]> = await requester({
        url: `/geographicAreas/information/incomplete`,
        method: 'GET'
      })

      if(response.code === 200)
        if(response.data !== undefined)
          return response;

      if(response.code === 400) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar obtener las areas geográficas con informacion incompleta"}}));
      }
      response.data = [];
      return response;
        
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectar con el servidor"}}));
      return errorResponse;
    }
  }

  const getBasicMemberInformationById = async(idMember: number):Promise<IMember> => {

    try {
      const response:IRequest<IMember[]> = await requester({
        url: `/members/${idMember}`,
        method: 'GET'
      })

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

  const getLeaderOfTheMemberById = async(idLeader: number):Promise<IMember> => {
    try {
      const response:IRequest<IMember[]> = await requester({
        url: `/members/${idLeader}`
      })
      if(response.code === 200)
        if(response.data !== undefined)
          return response.data[0]

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Hubo problemas al momento de obtener la informacion del lider del miembro, intente nuevamente"}}));
      return emptyMember;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return emptyMember;
    }
  }

  const getCountAllStructure = async():Promise<IRequest<any>> => {
    const defaultData = {
      "amount_female": 0,
      "amount_male": 0,
      "total": 0
    }
    errorResponse.data = defaultData;

    try {
      const response:IRequest<any> = await requester({
        url: `/data/structure/total/`
      })
      if(response.code === 200)
        if(response.data !== undefined)
          return response

      response.data = defaultData;
      if(response.code === 400) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "Hubo problemas al momento de obtener el total de miembros en la estructura, intente nuevamente"}}));
        return response
      }

      return response;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return errorResponse;
    }
  }

  const getAgeHistogram = async():Promise<IRequest<any>> => {
    try {
      const response:IRequest<any> = await requester({
        url: `/data/structure/age`
      })

      if(response.code === 200)
        if(response.data !== undefined)
          return response

      if(response.code === 400) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "Hubo problemas al momento de obtener el total de miembros en la estructura, intente nuevamente"}}));
      }
      return response;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return errorResponse;
    }
  }

  const getColoniesRanking = async(idStrategy: number|undefined):Promise<any[]> => {
    try {
      let endpoint = '';
      if (idStrategy === undefined) endpoint = `/data/structure/colony/ranking/0`
      else endpoint = `/data/structure/colony/ranking/${idStrategy}`
      
      console.log(endpoint)
      const response:IRequest<any> = await requester({
        url: endpoint
      })

      if(response.code === 200)
        if(response.data !== undefined)
          return response.data

      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Hubo problemas al momento de obtener el total de miembros en la estructura, intente nuevamente"}}));
      return [];

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return [];
    }
  }

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

  const getRankingIndividualStructure = async(idStrategyLevel:number):Promise<IMemberRankingStructure[]> => {
    try {
      const response:IRequest<IMemberRankingStructure[]> = await requester({
        url: `data/structure/leaders/${idStrategyLevel}`,
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

  // Handlers
  const handleOnUpdate = async(id_member:number|undefined):Promise<void> => {
    if(id_member) {
      //To updata member case
      //Get basic member's information  
      const basicMemberInformation:IMember = await getBasicMemberInformationById(id_member);
  
      //Get strategic member's information case
      if(basicMemberInformation.id_member !== 0 &&
        basicMemberInformation.id_member !== undefined) {
        if(basicMemberInformation.int_number === null) 
          basicMemberInformation.int_number = ""
        setMemberBasicInfoToUpdate(basicMemberInformation);
        //Get strategic information
        const strategicMemberInformation:IStructure 
          = await getStrategicMemberInformation(basicMemberInformation.id_member)
          
        if(strategicMemberInformation.id_member !== 0) {
          // If the member has a leader        
          if(strategicMemberInformation.id_leader !== null &&
            strategicMemberInformation.id_leader !== undefined
            ) {
            const leaderData:IMember = await getLeaderOfTheMemberById(strategicMemberInformation.id_leader);
            strategicMemberInformation.first_name_leader=leaderData.first_name 
            strategicMemberInformation.last_name_leader = leaderData.last_name  
          }
                
          if (strategicMemberInformation.first_name_leader === undefined)
            strategicMemberInformation.first_name_leader = '' 
          if (strategicMemberInformation.last_name_leader === undefined)
            strategicMemberInformation.last_name_leader= '' 
          
          setMemberStrategicInfoToUpdate(strategicMemberInformation)
          setShowForm(true)             
        }
      }
    } 
  }

  const handleOnSendData = async () => {
    /*
      This handler is executed to close PersonForm, after that we restart the
      array for search persons.
    */
    setShowForm(false);
    const response = await getMembersWithoutCompleteInformation();
    if(response.data !== undefined) {
      setIncompleteMembersProfile(response.data);
    }
  }

  const handleSearchStrategyLevelStructure = async (event: any, newInputValue: string | null) => {
    if (newInputValue !== null) 
      if(newInputValue!=="") setSearchStrategyLevelStructure(newInputValue)
  }

  const handleSelectStrategyLevelStructure = async (event: any, newValue: string | null) => {
    const strategyLevelSelected: IStrategy|undefined = 
    arrayStrategyLevel.find(strategyLevel => strategyLevel.role === newValue);
    if(strategyLevelSelected !== undefined) {
      setMemberStructure(await getRankingIndividualStructure(strategyLevelSelected.id_strategy));
    }
    
  }

  const handleSearchStrategyLevelColony = async (event: any, newInputValue: string | null) => {
    if (newInputValue !== null) 
      if(newInputValue!=="") setSearchStrategyLevelColony(newInputValue)
  }

  const handleSelectStrategyLevelColony = async (event: any, newValue: string | null) => {
    const strategyLevelSelected: IStrategy|undefined = 
    arrayStrategyLevel.find(strategyLevel => strategyLevel.role === newValue);
    if(strategyLevelSelected !== undefined) {
      setRankingColonies(await getColoniesRanking(strategyLevelSelected.id_strategy));
    }
    
  }

  return (
    <>
      {showForm &&
          <FormPerson
          label="Actualizar miembro"
          action={1}
          handleSubmit={handleOnSendData}

          initialPersonInformation={memberBasicInfoToUpdate}
          initialStrategicInformation={memberStrategicInfoToUpdate}
        />
      }
      { (showForm === false) &&
        <div className="flex flex-col font-bold text-bg text-center"> 
          <p className="text-center mb-3 text-xl font-bold">
            Miembros de la estructura con información incompleta
          </p>
          {(incompleteMembersProfile[0] !== undefined && updateMemberPrivilege) ?
            <Paper sx={{overflow: 'hidden'}}>
              <TableContainer sx={{ maxHeight: 440 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">ID</TableCell>
                      <TableCell align="center">Nombre</TableCell>
                      <TableCell align="center">Telefono</TableCell> 
                      <TableCell align="center">INE</TableCell> 
                      <TableCell align="center">Colonia</TableCell>
                      <TableCell align="center">Nivel jerarquico</TableCell>
                      <TableCell align="center">Lider</TableCell>
                      <TableCell align="center">Area geografica</TableCell>
                      <TableCell align="center">Editar</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {
                      incompleteMembersProfile.map(person => {
                        return (
                          <TableRow key={person.id_member}>
                            <TableCell align="center">
                              {person.id_member}
                            </TableCell>
                            <TableCell align="center">
                              {person.last_name} {person.first_name}
                            </TableCell>
                            <TableCell align="center">
                              {person.cell_phone_number}
                            </TableCell>
                            <TableCell align="center">
                              {person.ine}
                            </TableCell>
                            <TableCell align="center">
                              <div className="text-xl flex flex-row justify-center">
                                {person.id_colony === null ?  
                                  <div className="text-orange-400">
                                    <MdErrorOutline />
                                  </div>
                                  :
                                  <div className="text-green-400">
                                    <BsCheckCircle />
                                  </div>
                                  }
                              </div>
                          </TableCell>
                            <TableCell align="center">
                              <div className="text-xl flex flex-row justify-center">
                                {person.id_strategy === null ?  
                                  <div className="text-orange-400">
                                    <MdErrorOutline />
                                  </div>
                                  :
                                  <div className="text-green-400">
                                    <BsCheckCircle />
                                  </div>
                                  }
                              </div>
                            </TableCell>
                            <TableCell align="center">
                              <div className="text-xl flex flex-row justify-center">
                                {person.id_leader === null ?  
                                  <div className="text-orange-400">
                                    <MdErrorOutline />
                                  </div>
                                  :
                                  <div className="text-green-400">
                                    <BsCheckCircle />
                                  </div>
                                  }
                              </div>
                            </TableCell>
                            <TableCell align="center">
                              <div className="text-xl flex flex-row justify-center">
                                {person.id_geographic_area === null ?  
                                  <div className="text-orange-400">
                                    <MdErrorOutline />
                                  </div>
                                  :
                                  <div className="text-green-400">
                                    <BsCheckCircle />
                                  </div>
                                  }
                              </div>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Editar">
                                <button
                                onClick={() => 
                                  {handleOnUpdate(person.id_member)}}
                                className="text-sky-600 text-2xl">
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
            </Paper> : 
            <p className="font-normal mt-3">Acceso no permitido</p>
          }
          <div className="mt-5">
            <p className="text-center mb-3 text-xl font-bold">
                  Areas geográficas con información incompleta
            </p>
            {(incompleteGeographicAreasInformation[0] !== undefined && updateGeographicAreaPrivilege === true) ?
              <Paper sx={{overflow: 'hidden'}}>
                <TableContainer sx={{ maxHeight: 440 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell align="center">ID</TableCell>
                        <TableCell align="center">Area geográfica</TableCell>
                        <TableCell align="center">Nivel jerarquico</TableCell>
                        <TableCell align="center">Pertenece a una area geografica</TableCell>
                        <TableCell align="center">Tiene un administrador</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {
                        incompleteGeographicAreasInformation.map(geographicArea => {
                          return (
                            <TableRow key={geographicArea.id_geographic_area}>
                              <TableCell align="center">
                                {geographicArea.id_geographic_area}
                              </TableCell>
                              <TableCell align="center">
                                {geographicArea.geographic_area_name}
                              </TableCell>
                              <TableCell align="center">
                                <div className="text-xl flex flex-row justify-center">
                                  {geographicArea.id_strategy === null ?  
                                    <div className="text-orange-400">
                                      <MdErrorOutline />
                                    </div>
                                    :
                                    <div className="text-green-400">
                                      <BsCheckCircle />
                                    </div>
                                    }
                                </div>
                            </TableCell>
                              <TableCell align="center">
                                <div className="text-xl flex flex-row justify-center">
                                  {geographicArea.id_geographic_area_belongs === null ?  
                                    <div className="text-orange-400">
                                      <MdErrorOutline />
                                    </div>
                                    :
                                    <div className="text-green-400">
                                      <BsCheckCircle />
                                    </div>
                                    }
                                </div>
                              </TableCell>
                              <TableCell align="center">
                                <div className="text-xl flex flex-row justify-center">
                                  {geographicArea.id_member === null ?  
                                    <div className="text-orange-400">
                                      <MdErrorOutline />
                                    </div>
                                    :
                                    <div className="text-sm">
                                      {geographicArea.first_name} {geographicArea.last_name}
                                    </div>
                                    }
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      }
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper> : 
              <p className="font-normal mt-3">Acceso no permitido</p>
            }
          </div>
          <div className="flex flex-row mx-2 mt-5 ">
            <div className="flex flex-col basis-1/3">
              <p className="">
                Numero total de miembros que conforman la estructura
              </p>
              { (totalAmountDataChart[0] !== undefined && allStructureCountPrivilege === true) ?
                <>
                  <p className="font-normal">
                    Total de miembros: {totalAmountDataChart[0] + totalAmountDataChart[1]}
                  </p>
                  <Pie data={
                    {
                      labels: ['Hombres', 'Mujeres'],
                      datasets: [
                        {
                          label: `# miembros`,
                          data: totalAmountDataChart,
                          backgroundColor: [
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 99, 132, 0.2)',
                          ],
                          borderColor: [
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 99, 132, 1)',
                          ],
                          borderWidth: 1,
                        },
                      ],
                    }
                  }/>
                </> :
                <p className="font-normal mt-3">Acceso no permitido</p>
              }
            </div>
            <div className="flex flex-col basis-2/3">
              <p  className="">
                Histograma de edades de la estructura
              </p>
              {(extraDataHistogram !== undefined && histogramAgesStructurePrivilege === true) ?
                <>
                  <p  className="font-normal text-md">
                    Miembro mas joven: {extraDataHistogram.youngestAge} años
                  </p>
                  <p  className="font-normal text-md">
                    Miembro mas mayor: {extraDataHistogram.oldestAge} años
                  </p>
                </> : 
                <p className="font-normal mt-3">Acceso no permitido</p>
              }
              { membersAgeDataHistogram !== undefined &&
                <div className="flex justify-center items-center ">
                  <Bar options={histogramOptions} data={membersAgeDataHistogram} />
                </div>
              }
            </div>
          </div>
          <div className="flex flex-col mt-5 mx-36">
            <p  className="mb-3">
              Ranking colonias con mas miembros
            </p>
            { rankingColoniesPrivilege === true ? 
              <>
                <div className="flex justify-center mb-3">
                  <Autocomplete
                      disablePortal
                      id="input-strategy"
                      onInputChange={(event: any, newInputValue: string | null) => 
                        { handleSearchStrategyLevelColony(event, newInputValue) }}
                      onChange={(event: any, newValue: string | null) => 
                        handleSelectStrategyLevelColony(event, newValue) }
                      value={
                        searchStrategyLevelColony
                      }
                      options={ arrayStrategyLevel.map((strategyLevel => strategyLevel.role)) }
                      sx={{ width: 300 }}
                      renderInput={(params) => <TextField {...params} label="Nivel jerárquico" />}
                    />
                </div>
                <Paper sx={{overflow: 'hidden'}}>
                  <TableContainer sx={{ maxHeight: 440 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell align="center">ID</TableCell>
                          <TableCell align="center">Nombre</TableCell>
                          <TableCell align="center">Codigo postal</TableCell> 
                          <TableCell align="center">Cantidad de miembros</TableCell> 
                          <TableCell align="center">Lider principal</TableCell> 
                          <TableCell align="center">Seguidores</TableCell> 
                        </TableRow>
                      </TableHead>
                      <TableBody>
                      {
                        rankingColonies[0] !== undefined &&
                          rankingColonies.map(colony => {
                            return (
                              <TableRow key={colony.id_colony}>
                                <TableCell align="center">
                                  {colony.id_colony}
                                </TableCell>
                                <TableCell align="center">
                                  {colony.name_colony}
                                </TableCell>
                                <TableCell align="center">
                                  {colony.postal_code}
                                </TableCell>
                                <TableCell align="center">
                                  {colony.amount_members}
                                </TableCell>
                                <TableCell align="center">
                                  {
                                    colony.main_leader_name === "" ? 
                                    "No se encontro ningún líder" :
                                    colony.main_leader_name
                                  }
                                </TableCell>
                                <TableCell align="center">
                                  {colony.leader_followers}
                                </TableCell>
                              </TableRow>
                            )
                          })
                      }
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>              
              </> :
              <p className="font-normal mt-3">Acceso no permitido</p>
            }

          </div>
          <div className="flex flex-col mt-5 mx-36">
            <p  className="mb-3">
              Ranking lideres con mas seguidores
            </p>
            { rankingLeadersPrivilege === true ?
              <>
                <div className="flex justify-center mb-3">
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
                </div>
                <Paper sx={{overflow: 'hidden'}}>
                  <TableContainer sx={{ maxHeight: 440 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell align="center">ID</TableCell>
                          <TableCell align="center">Nombre</TableCell>
                          <TableCell align="center">No. Seguidores</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {
                          rankingMemberStructure.map(member => {
                            return (
                              <TableRow key={member.id_member}>
                                <TableCell align="center">
                                  {member.id_member}
                                </TableCell>
                                <TableCell align="center">
                                  {member.first_name} {member.last_name}
                                </TableCell>
                                <TableCell align="center">
                                  {member.followers - 1}
                                </TableCell>
                              </TableRow>
                            )
                          })
                        }
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>              
              </> :
              <p className="font-normal mt-3">Acceso no permitido</p>
            }

          </div> 
        </div>
      }
    </>
  )
}

export default MainMenuComponent;