import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import { IoChevronDown } from 'react-icons/io5';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Chip } from '@mui/material';

import Searcher from "../UIcomponents/Searcher";
import { IStructure, IRequest, IMember, IColony } from "../../interfaces/interfaces";
import requester from "../../helpers/Requester";
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useState } from "react";
import Button from '../UIcomponents/Button';


const ColonyAnalisysTable = () => {
  const [searchMembers, setSearchMembers] = useState<IStructure[]>([]);
  const [storeResponseSearchMember, setStoreResponseSearchMember] = useState<IStructure[]>([]);
  const [searchColonies, setSearchColonies] = useState<IColony[]>([]);
  const [storeResponseSearchColonies, setStoreResponseSearchColonies] = useState<IColony[]>([]);

  const [coloniesSelected, setColoniesSelected] = useState<IColony[]>([]);

  const [membersByColonyArray, setMemberByColonyArray] = useState<IMember[][]>([]);
  const [leaderConsulted, setLeaderConsulted] = useState<IStructure|undefined>(undefined);
  const [leader, setLeader] = useState<IStructure|undefined>(undefined);
  //Reducer for alert message
  const dispatch:Dispatch<AnyAction> = useDispatch();
  const userData = useSelector((state: RootState) => state.userReducer);

  //Calls to API
  const searchMember = async(string_to_search: string):Promise<IStructure[]> => {
    try {
      const response:IRequest<IStructure[]> = await requester({
        url: `/members/search/${string_to_search}`,
        method: 'GET'
      })

      if(response.code === 200) 
        if(response.data !== undefined) 
          return response.data;
        
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Ha habido un problema al intentar hacer la busqueda, intente nuevamente"}}));  
      return [];
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return [];
    }
  }

  const searchMemberByLeaderAndColony = async(idLeader: number, arrayColonies: number[]):Promise<any> => {
    try {
      const data:any = {
        "idLeader": idLeader,
        "arrayColonies": arrayColonies
      }

      
      const response:IRequest<IMember[][]> = await requester({
        url: `/data/structure/colonies`,
        method: 'PATCH',
        data: data
      })
      
      if(response.code === 200) 
        if(response.data !== undefined) 
          return response.data;
        
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Ha habido un problema al intentar hacer la busqueda, intente nuevamente"}}));  
      return [];
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return [];
    }
  }

  const searchMemberByColony = async(arrayColonies: number[]):Promise<any> => {
    try {
      const data:any = {
        "arrayIdColonies": arrayColonies
      }

      const response:IRequest<IMember[][]> = await requester({
        url: `/data/colonies/members`,
        method: 'PATCH',
        data: data
      })
      
      if(response.code === 200) 
        if(response.data !== undefined) 
          return response.data;
        
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.warning, 
        message: "Ha habido un problema al intentar hacer la busqueda, intente nuevamente"}}));  
      return [];
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
      return [];
    }
  }

  const searchColony = async (colonyToSearch: string):Promise<IColony[]> => {
    try {
      const response: IRequest<IColony[]> = await requester({
        url: `/colonies/name/${colonyToSearch}`,
        method: 'GET',
      })
      if(response.code === 200) {
        if(response.data !== undefined) return response.data;
      } else {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar buscar las colonias, intente mas tarde"}})); 
      }
      return [];
    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar buscar las colonias, intente mas tarde"}}));
      return [];
    }

  }

  //Handlers
  const onSearchTypeMember = async(stringToSearch: string) => {
    if(stringToSearch === "") {
      setStoreResponseSearchMember([]);
      setSearchMembers([]);
    } else {
      if(storeResponseSearchMember[0] !== undefined) {
        console.log("FILTRAR")
        const re = new RegExp(`^${stringToSearch.toLowerCase()}[a-zA-Z0-9\ \d\D]*`);
      
        const personsToShow:IStructure[] = storeResponseSearchMember.filter(person => {
            const name = `${person.first_name} ${person.last_name}`;
            const cell_phone_number = `${person.cell_phone_number}`;
            const ine = `${person.ine}`;
            if(
                re.test(name.toLocaleLowerCase()) === true ||
                re.test(cell_phone_number) === true ||
                re.test(ine)
              ) 
              return person;
          })
        
        if(personsToShow !== undefined) setSearchMembers(personsToShow);
        else setSearchMembers([]);  
      } else {
        const responseData:IStructure[] = await searchMember(stringToSearch);
        setStoreResponseSearchMember(responseData);
        setSearchMembers(responseData);
      }
    }
  }

  const selectOptionMember = async (idLeader: number) => {
    const findDataLeader = storeResponseSearchMember
    .find(member => member.id_member === idLeader);
    if(findDataLeader!==undefined) setLeader(findDataLeader);
    setSearchMembers([]);
    setStoreResponseSearchMember([]);
    
  }

  const onSearchTypeColony = async(stringToSearch: string) => {
    console.log("On search colony: ", stringToSearch)
    if(stringToSearch === "") {
      setStoreResponseSearchColonies([]);
      setSearchColonies([]);
    } else {
      if(storeResponseSearchColonies[0] !== undefined) {
        console.log("FILTRAR")
        const re = new RegExp(`^${stringToSearch.toLowerCase()}[a-zA-Z0-9\ \d\D]*`);
      
        const coloniesToShow:IColony[] = storeResponseSearchColonies.filter(colony => {
            const name = `${colony.name_colony}`;
            if(re.test(name.toLocaleLowerCase()) === true) 
              return colony;
          })
        
        if(coloniesToShow !== undefined) setSearchColonies(coloniesToShow);
        else setSearchColonies([]);  
      } else {
        console.log("search")
        const responseData:IColony[] = await searchColony(stringToSearch);
        
        //Filter Colonies already selected
        const responseDataWithoutSelected:IColony[] =  [];
        for(let i = 0; i < responseData.length; i++) {
          if(coloniesSelected.find(
              colony => colony.id_colony === responseData[i].id_colony) ===
              undefined
            ) responseDataWithoutSelected.push(responseData[i]);
        }
        
        setStoreResponseSearchColonies(responseDataWithoutSelected);
        setSearchColonies(responseDataWithoutSelected);
      }
    }
  }

  const selectOptionColony = async(idColony: number) => {
    const newColony:IColony|undefined = searchColonies
      .find(colony => colony.id_colony === idColony);
    if(newColony !== undefined) {
      coloniesSelected.push(newColony);
      setColoniesSelected(coloniesSelected);
    }
    setSearchColonies([]);
    setStoreResponseSearchColonies([]);
  }

  const unSelectOptionColony = async(colonyToRemove: IColony) => {
    setColoniesSelected(
      coloniesSelected.filter(colony => colony.id_colony !== colonyToRemove.id_colony)
    )
    setSearchColonies([]);
    setStoreResponseSearchColonies([]);
  }

  //Handle to search
  const handleSearch = async() => {
    const arrIdColonies = coloniesSelected.map(colony => {return colony.id_colony})
    if(leader !== undefined) {
      const { id_member } = leader;
      const data:any = await searchMemberByLeaderAndColony(id_member, arrIdColonies);
      setMemberByColonyArray(data);
      const leaderData:IStructure|undefined = storeResponseSearchMember
        .find(member => member.id_member === id_member);
      setLeaderConsulted(leader);
    } else if(coloniesSelected[0] !== undefined) {
      const data:any = await searchMemberByColony(arrIdColonies);
      console.log(data)
      setMemberByColonyArray(data);
    }
  }

  const handleDeleteSearch = async() => {
    setSearchMembers([]);
    setStoreResponseSearchMember([]);
    setSearchColonies([]);
    setStoreResponseSearchColonies([]);
    setColoniesSelected([]);
    setMemberByColonyArray([]);
    setLeaderConsulted(undefined);
    setLeader(undefined)
  }

  return (
    <div>
      <div className='flex flex-row'>
        <Searcher 
          placeholder={"Buscar por nombre, numero ó INE"}
          optionsToShow={searchMembers.map(element => {
            const option = {
              id: element.id_member,
              data: `${element.first_name} ${element.last_name} / ${element.cell_phone_number} / ${element.ine}`
            }
            return option;
          })}
          onSelectOption={selectOptionMember}
          onType={onSearchTypeMember}
        />
        <div className='ml-2'>
          <Searcher 
            placeholder={"Buscar colonia"}
            optionsToShow={searchColonies.map(element => {
              const option = {
                id: element.id_colony,
                data: `${element.name_colony} - C.P: ${element.postal_code}`
              }
              return option;
            })}
            onSelectOption={selectOptionColony}
            onType={onSearchTypeColony}
          />
        </div>
      </div>
      {
        leader !== undefined &&
        <p className='ml-3'>Lider a buscar: 
          <span className='ml-2 italic'>
            {leader.first_name} {leader.last_name}
          </span>
        </p>
      }
      {coloniesSelected.length > 0 &&
        <div className='flex flex-row flex-wrap ml-2'>
          {
            coloniesSelected.map(colonySelected => {
              return <div
                  key={colonySelected.id_colony}
                  className='ml-1 mt-1'>
                <Chip 
                  label={`${colonySelected.name_colony} - ${colonySelected.postal_code}`}
                  onDelete={() => unSelectOptionColony(colonySelected)}
                />
              </div>
            })
          }
        </div>
      }
      <div>
        <Button 
          label='Buscar'
          onClick={handleSearch}
          />
        <Button 
          label='Borrar busqueda'
          colorButton={1}
          onClick={handleDeleteSearch}
        />
      </div>
      {leaderConsulted !== undefined &&        
        <p className='ml-3 my-2'>
          Nombre del lider: 
          <span className='ml-3 italic font-bold'>
            {leaderConsulted.first_name} {leaderConsulted.last_name}  
          </span>
        </p>
      }
      <div className='overflow-scroll max-h-96'>
        { membersByColonyArray[0] !== undefined ?
          (
            <div className='m-3'>
              {membersByColonyArray.map(colony => {              
                return <div className='my-1' key={colony[0].id_colony}>
                  <Accordion >
                    <AccordionSummary
                      expandIcon={
                        <div className='text-2xl'>
                          <IoChevronDown/>
                        </div>
                    }
                      aria-controls="panel1a-content"
                      id="panel1a-header"
                    >
                      <div className='flex flex-col'>
                        <Typography>{colony[0].colony_name} - C.P: {colony[0].postal_code}</Typography>
                        <Typography>No. miembros: {colony.length}</Typography>
                      </div>

                    </AccordionSummary>
                    <AccordionDetails>
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
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {
                                colony.map(person => {
                                  return (
                                    <TableRow key={person.id_member}>
                                      <TableCell align="center">
                                        {person.id_member}
                                      </TableCell>
                                      <TableCell align="center">
                                        { person.first_name } { person.last_name }
                                      </TableCell>
                                      <TableCell align="center">
                                        { person.cell_phone_number }
                                      </TableCell>
                                      <TableCell align="center">
                                        { person.ine }
                                      </TableCell>
                                      <TableCell align="center">
                                        {person.street} #{person.ext_number} {person.int_number !== null && `Int: ${person.int_number}`} ,{person.colony_name}
                                      </TableCell>
                                    </TableRow>
                                  )
                                })
                              }
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Paper>
                    </AccordionDetails>
                  </Accordion>  
                </div>
                  
                
              })}
            </div>
          ) :
          (leaderConsulted !== undefined &&
            <p className='font-bold m-3 text-lg'>No tiene seguidores</p>)
        }
      </div>
    </div>
  )
}

export default ColonyAnalisysTable;