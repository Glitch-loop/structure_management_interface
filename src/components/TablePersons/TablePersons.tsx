import {useState} from "react";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Searcher from '../UIcomponents/Searcher';
import { IStructure, IRequest, IMember } from "../../interfaces/interfaces";
import requester from "../../helpers/Requester";
import { Paper, Tooltip } from "@mui/material";
import {MdDeleteForever, MdEditDocument} from 'react-icons/md'

const TablePersons = () => {
  const [personsFounded, setPersonsFounded] = useState<IStructure[]>([]);

  const handleSearchPerson = async (personToSearch: string) => {
    console.log("Search: ", personToSearch)
    
    const re = new RegExp(`^${personToSearch.toLowerCase()}[a-zA-Z0-9\ \d\D]*`);
    
    const personsToShow:IStructure[] = personsFounded.filter(person => {
        const name = `${person.first_name} ${person.last_name}`;
        if(re.test(name.toLocaleLowerCase()) === true) 
          return person
      })
    
    try {
      if(personsToShow[0] === undefined) {
        console.log("PEDIR A API")
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

  const handleOnUpdate = async (idMember:number) => {
    console.log(idMember)
    try {
      const memberResult:IRequest<IMember> = await requester({
        url: `/members/${idMember}`,
        method: 'GET'
      })
      console.log(memberResult)
    } catch (error) {
      console.log(error)
    }
  }  
  return (
    <>
      
      <Searcher handleSearcher={handleSearchPerson}/>
      {personsFounded[0] !== undefined &&
      <div className="mt-2 overscroll-y-contain">
        <TableContainer component={Paper}>
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
                          <button className="text-2xl">
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
      </div>
      }
    </>
  )
}

export default TablePersons;
