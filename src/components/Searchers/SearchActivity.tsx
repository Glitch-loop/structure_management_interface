import { useState } from 'react';
import { IActivity, IRequest } from '../../interfaces/interfaces';
import requester from '../../helpers/Requester';
import Searcher from '../UIcomponents/Searcher';
import { Dispatch, AnyAction } from 'redux';
import { useDispatch } from 'react-redux';
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";

const SearchActivity = ({onSelectItem}:{onSelectItem:any}) => {
  const [searchItem, setSearchItem] = useState<IActivity[]>([]);
  const [storeResponseSearchItem, setStoreResponseSearchItem] = useState<IActivity[]>([]);
  const [itemSelected, setItemSelected] = useState<boolean>(false);

  const dispatch:Dispatch<AnyAction> = useDispatch();

  /*Request to API*/
  const searchItemByName = async(string_to_search: string):Promise<IActivity[]> => {
    try {
      const response:IRequest<IActivity[]> = await requester({
        url: `/activities/search/${string_to_search}`,
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

  const onSearchType = async(stringToSearch: string) => {
    if(stringToSearch === "") {
      setStoreResponseSearchItem([]);
      setSearchItem([]);

      setItemSelected(false); //User erase the item selected
    } else {
      if(storeResponseSearchItem[0] !== undefined) {
        const re = new RegExp(`^${stringToSearch.toLowerCase()}[a-zA-Z0-9\ \d\D]*`);
      
        const itemToShow:IActivity[] = storeResponseSearchItem.filter(item => {
            const name = `${item.name_activity}`;
            if(
                re.test(name.toLocaleLowerCase()) === true
              ) 
              return item;
          })
        
        if(itemToShow !== undefined) setSearchItem(itemToShow);
        else setSearchItem([]);  
      } else {
        if(itemSelected === false) {
          const responseData:IActivity[] = await searchItemByName(stringToSearch);
          setStoreResponseSearchItem(responseData);
          setSearchItem(responseData);
        }
      }
    }
  }

  const selectOption = async (idItem: number):Promise<void> => {
    const findDataItem:undefined|IActivity = storeResponseSearchItem
      .find(item => item.id_activity === idItem);
    
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
      placeholder={"Buscar por nombre de actividad"}
      optionsToShow={searchItem.map(element => {
        let dataDisplayed = "";

        if (element.expiration_date !== null) {
          dataDisplayed = `/ No expira`
        } 
        const option = {
          id: element.id_activity,
          data: `${element.name_activity} / Creada: ${element.creation_date} / Expira: ${dataDisplayed}`
        }
        return option;
      })}
      onSelectOption={selectOption}
      onType={onSearchType}
      />
    </>

  );
}

export default SearchActivity;