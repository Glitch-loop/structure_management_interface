import { useState } from 'react';
import { IRequest, ISectional } from '../../interfaces/interfaces';
import requester from '../../helpers/Requester';
import Searcher from '../UIcomponents/Searcher';
import { Dispatch, AnyAction } from 'redux';
import { useDispatch } from 'react-redux';
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";

const SearchSectionals = ({onSelectItem}:{onSelectItem:any}) => {
  const [searchItem, setSearchItem] = useState<ISectional[]>([]);
  const [storeResponseSearchItem, setStoreResponseSearchItem] = useState<ISectional[]>([]);
  const [itemSelected, setItemSelected] = useState<boolean>(false);

  const dispatch:Dispatch<AnyAction> = useDispatch();

  /*Request to API*/
  const searchItemByName = async(string_to_search: string):Promise<ISectional[]> => {
    try {
      const response:IRequest<ISectional[]> = await requester({
        url: `/sectionals/areas/without/coordinates/${string_to_search}`,
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
      setStoreResponseSearchItem([]);
      setSearchItem([]);

      setItemSelected(false); //User erase the item selected
    } else {
      if(storeResponseSearchItem[0] !== undefined) {
        const re = new RegExp(`^${stringToSearch.toLowerCase()}[a-zA-Z0-9\ \d\D]*`);
      
        const itemToShow:ISectional[] = storeResponseSearchItem.filter(item => {
            const name = `${item.sectional_name}`;
            if(
                re.test(name.toLocaleLowerCase()) === true
              ) 
              return item;
          })
        
        if(itemToShow !== undefined) setSearchItem(itemToShow);
        else setSearchItem([]);  
      } else {
        if(itemSelected === false) {
          const responseData:ISectional[] = await searchItemByName(stringToSearch);
          setStoreResponseSearchItem(responseData);
          setSearchItem(responseData);
        }
      }
    }
  }

  const selectOptionMember = async (idItem: number):Promise<void> => {
    const findDataItem:undefined|ISectional = storeResponseSearchItem
      .find(item => item.id_sectional === idItem);
    
    //User selected an item
    setItemSelected(true);

    // Reset states
    setSearchItem([]);
    setStoreResponseSearchItem([]);

    //Return search results
    onSelectItem(findDataItem);
  }

  return (
    <>
      <Searcher 
      placeholder={"Buscar por nombre de seccional"}
      optionsToShow={searchItem.map(element => {
        let dataDisplayed = "";

        if (element.sectional_address !== null) {
          dataDisplayed = `/ ${element.sectional_address}`
        } 
        const option = {
          id: element.id_sectional,
          data: `${element.sectional_name} ${dataDisplayed}`
        }
        return option;
      })}
      onSelectOption={selectOptionMember}
      onType={onSearchTypeMember}
      />
    </>

  );
}

export default SearchSectionals;