import {useState} from "react";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Searcher from '../UIcomponents/Searcher';
import { IStructure, IRequest, IMember } from "../../interfaces/interfaces";
import requester from "../../helpers/Requester";
import { Tooltip } from "@mui/material";
import {MdDeleteForever, MdEditDocument} from 'react-icons/md'
import FormPerson from "../FormPersons/FormPerson";

const TablePersons = () => {
  const [personsFounded, setPersonsFounded] = useState<IStructure[]>([]);
  const [memberBasicInfoToUpdate, setMemberBasicInfoToUpdate] = useState<IMember>();
  const [memberStrategicInfoToUpdate, setMemberStrategicInfoToUpdate] = useState<IStructure>();
  const [showForm, setShowForm] = useState<boolean>();


  const handleSearchPerson = async (personToSearch: string) => {
    const re = new RegExp(`^${personToSearch.toLowerCase()}[a-zA-Z0-9\ \d\D]*`);
    
    const personsToShow:IStructure[] = personsFounded.filter(person => {
        const name = `${person.first_name} ${person.last_name}`;
        if(re.test(name.toLocaleLowerCase()) === true) 
          return person
      })
    
    try {
      if(personsToShow[0] === undefined) {
        const resultPerson:IRequest<IStructure[]> = await requester(
          {
            url: `/members/name/${personToSearch}`,
            method: 'GET'
          })
  
          if(resultPerson.data !== undefined) {
            setPersonsFounded(resultPerson.data)
          }
      } else {console.log("Just filter"); setPersonsFounded(personsToShow)}
    } catch (error) {
      console.log(error)
    }
  }

  const handleOnSendData = async (status:boolean) => {
    setShowForm(false)
    setPersonsFounded([])
  }


  const handleOnUpdate = async (idMember:number) => {
    try {
      //To updata member case
      //Get basic member's information  
      const memberResult:IRequest<IMember[]> = await requester({
        url: `/members/${idMember}`,
        method: 'GET'
      })
      
      //Get strategic member's information case
      if(memberResult.data !== undefined) {
        const basicMemberInformation:IMember = memberResult.data[0];
        setMemberBasicInfoToUpdate(basicMemberInformation)
      }
      
      //Get strategic information
      const strategicInfoResult:IRequest<IStructure[]> = await requester({
        url: `/members/strategicInformation/${idMember}`
      })
      if(strategicInfoResult.data !== undefined) {
        const strategicMemberInformation:IStructure = strategicInfoResult.data[0];
        // If the member has a leader        
        if(strategicMemberInformation.id_leader !== null) {
          const leaderResult:IRequest<IMember[]> = await requester({
            url: `/members/${strategicMemberInformation.id_leader}`
          })
          if(leaderResult.data !== undefined) {
            const leaderData:IMember = leaderResult.data[0];
            strategicMemberInformation.first_name_leader=leaderData.first_name 
            strategicMemberInformation.last_name_leader = leaderData.last_name  
          }
        } 
              
        if (strategicMemberInformation.first_name_leader === undefined)
          strategicMemberInformation.first_name_leader = '' 
        if (strategicMemberInformation.last_name_leader === undefined)
          strategicMemberInformation.last_name_leader= '' 
        
        setMemberStrategicInfoToUpdate(strategicMemberInformation)
        setShowForm(true)             
      } 
      
    } catch (error) {
      console.log(error)
    }
  }  

  const handleOnDelete = async (idPerson:number) => {
    try {
      const operationResult:IRequest<undefined> = await requester({
        url: `/members/${idPerson}`,
        method: 'DELETE'
      })
      console.log("Result of operation: ", operationResult)

    } catch (error) {
      console.log("there is an error: ", error)
    }
  }
  
  return (
    <div className=""> 
      {
        (showForm===true) ?
        (<FormPerson
          label="Actualizar miembro"
          action={1}
          handleSubmit={handleOnSendData}

          initialPersonInformation={memberBasicInfoToUpdate}
          initialStrategicInformation={memberStrategicInfoToUpdate}
        />) :
        (<>

          <Searcher handleSearcher={handleSearchPerson}/>
          {personsFounded[0] !== undefined &&          
          <Paper sx={{overflow: 'hidden'}}>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell align="center">ID</TableCell>
                    <TableCell align="center">Nombre</TableCell>
                    <TableCell align="center">Modificar</TableCell>
                    <TableCell align="center">Eliminar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {
                    personsFounded.map(person => {
                      return (
                        <TableRow key={person.id_member}>
                          <TableCell align="center">
                            {person.id_member}
                          </TableCell>
                          <TableCell align="center">
                            {person.first_name} {person.last_name}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Editar">
                              <button
                              onClick={() => 
                                {handleOnUpdate(person.id_member)}}
                              className="text-2xl">
                                <MdEditDocument />
                              </button>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Eliminar">
                              <button onClick={() => 
                                {handleOnDelete(person.id_member)}}
                              className="text-2xl">
                                <MdDeleteForever />
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
        </>)
      }
    </div>
  )
}

export default TablePersons;
