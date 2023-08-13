import { useState } from 'react';
import { IStructure, IRequest, ISectional } from '../../interfaces/interfaces';
import requester from '../../helpers/Requester';
import Searcher from '../UIcomponents/Searcher';
import { Dispatch, AnyAction } from 'redux';
import { useDispatch } from 'react-redux';
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";

const SearchGeographicArea = ({onSelectItem}:{onSelectItem:any}) => {
  const [searchItem, setSearchItem] = useState<IStructure[]>([]);
  const [storeResponseSearchItem, setStoreResponseSearchItem] = useState<IStructure[]>([]);
  const [itemSelected, setItemSelected] = useState<boolean>(false);

  const dispatch:Dispatch<AnyAction> = useDispatch();

  /*Request to API*/
  const searchItemByName = async(string_to_search: string):Promise<IStructure[]> => {
    try {
      const response:IRequest<IStructure[]> = await requester({
        url: `/geographicAreas/search/${string_to_search}`,
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
      
        const itemToShow:IStructure[] = storeResponseSearchItem.filter(item => {
            const name = `${item.geographic_area_name}`;
            if(
                re.test(name.toLocaleLowerCase()) === true
              ) 
              return item;
          })
        
        if(itemToShow !== undefined) setSearchItem(itemToShow);
        else setSearchItem([]);  
      } else {
        if(itemSelected === false) {
          const responseData:IStructure[] = await searchItemByName(stringToSearch);
          setStoreResponseSearchItem(responseData);
          setSearchItem(responseData);
        }
      }
    }
  }

  const selectOptionMember = async (idItem: number):Promise<void> => {
    const findDataItem:undefined|IStructure = storeResponseSearchItem
      .find(item => item.id_geographic_area === idItem);
    
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
        placeholder="Buscar por area geografica o administrador"
        optionsToShow = {searchItem.map(element => {
          const option = {
            id: element.id_geographic_area !== undefined ? 
              element.id_geographic_area : 0,
            data: `${element.geographic_area_name} | ${
              element.zone_type === null ? "No tiene tipo de zona" : element.zone_type
            } - ${
              (element.first_name === null && element.last_name === null) ? "No tiene administrador" : `${element.first_name} ${element.last_name}`
            } - ${
              element.id_geographic_area
            }`
          }
          return option;
        })}
        onSelectOption={selectOptionMember}
        onType={onSearchType}
      />
    </>

  );
}

export default SearchGeographicArea;