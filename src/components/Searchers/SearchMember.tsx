import { useState } from 'react';
import { IStructure, IRequest } from '../../interfaces/interfaces';
import requester from '../../helpers/Requester';
import Searcher from '../UIcomponents/Searcher';
import { Dispatch, AnyAction } from 'redux';
import { useDispatch } from 'react-redux';
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";

const SearchMember = ({onSelectItem}:{onSelectItem:any}) => {
  const [searchMembers, setSearchMembers] = useState<IStructure[]>([]);
  const [storeResponseSearchMember, setStoreResponseSearchMember] = useState<IStructure[]>([]);
  const [itemSelected, setItemSelected] = useState<boolean>(false);

  const dispatch:Dispatch<AnyAction> = useDispatch();

  /*Request to API*/
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

  const onSearchTypeMember = async(stringToSearch: string) => {
    if(stringToSearch === "") {
      setStoreResponseSearchMember([]);
      setSearchMembers([]);

      setItemSelected(false); //User erase the item selected
    } else {
      if(storeResponseSearchMember[0] !== undefined) {
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
        if(itemSelected === false) {
          const responseData:IStructure[] = await searchMember(stringToSearch);
          setStoreResponseSearchMember(responseData);
          setSearchMembers(responseData);
        }
      }
    }
  }

  const selectOptionMember = async (idMember: number):Promise<void> => {
    const findDataLeader:undefined|IStructure = storeResponseSearchMember
      .find(member => member.id_member === idMember);
    
    //User selected an item
    setItemSelected(true);

    // Reset states
    setSearchMembers([]);
    setStoreResponseSearchMember([]);

    //Return search results
    onSelectItem(findDataLeader);
  }

  return (
    <>
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
    </>

  );
}

export default SearchMember;