import { useState, useEffect } from 'react';
import { IStructure, IRequest, ISectional, IOption } from '../../interfaces/interfaces';
import requester from '../../helpers/Requester';
import Searcher from '../UIcomponents/Searcher';
import { Dispatch, AnyAction } from 'redux';
import { useDispatch } from 'react-redux';
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";

const SearchAllTypesGeographicAreas = ({onSelectItem}:{onSelectItem:any}) => {
  // Privileges stares
  const [searchGeographicAreaPrivilege, setSearchGeographicAreaPrivilege] = useState<boolean>(false);
  const [searchSectionalAreaPrivilege, setSearchSectionalAreaPrivilege] = useState<boolean>(false);
  const [addGeographicAreaPrivilege, setAddGeographicAreaPrivilege] = useState<boolean>(false);
  const [updateGeographicAreaPrivilege, setUpdateGeographicAreaPrivilege] = useState<boolean>(false);
  const [deleteGeographicAreaPrivilege, setDeleteGeographicAreaPrivilege] = useState<boolean>(false);
  const [updateSectionalArea, setUpdateSectionalArea] = useState<boolean>(false);

  // Operatonal states
  const [searchItem, setSearchItem] = useState<IStructure[] & ISectional[]>([]);
  const [storeResponseSearchItem, setStoreResponseSearchItem] = useState<IStructure[] & ISectional[]>([]);
  const [itemSelected, setItemSelected] = useState<boolean>(false);

  const dispatch:Dispatch<AnyAction> = useDispatch();

  useEffect(() => {
    //add geographic area privilege
    requester({url: '/privileges/user/[14]', method: "GET"})
    .then(response => {
      setAddGeographicAreaPrivilege(response.data.privilege);
    });

    //update geographic area privilege
    requester({url: '/privileges/user/[15]', method: "GET"})
    .then(response => {
      setUpdateGeographicAreaPrivilege(response.data.privilege);
    });

    //delete geographic area privilege
    requester({url: '/privileges/user/[16]', method: "GET"})
    .then(response => {
      setDeleteGeographicAreaPrivilege(response.data.privilege);
    });

    //Get search geographic area privilege
    requester({url: '/privileges/user/[29]', method: "GET"})
    .then(response => {
      setSearchGeographicAreaPrivilege(response.data.privilege);
    });

    //Update sectional area
    requester({url: '/privileges/user/[34]', method: "GET"})
    .then(response => {
      setUpdateSectionalArea(response.data.privilege)
    });


    //Get view all geographic areas privilege
    requester({url: '/privileges/user/[35]', method: "GET"})
    .then(response => {
      setSearchSectionalAreaPrivilege(response.data.privilege);
    });
    
  }, []);

  /*Request to API*/
  const searchItemByNameOption1 = async(string_to_search: string):Promise<IStructure[]&ISectional[]> => {
    try {
      const response:IRequest<IStructure[]&ISectional[]> = await requester({
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


  const searchItemByNameOption2 = async(string_to_search: string):Promise<IStructure[]&ISectional[]> => {
    try {
      const response:IRequest<IStructure[]&ISectional[]> = await requester({
        url: `/sectionals/name/${string_to_search}`,
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


  /*
    This function is to handle the event when the user "type" a new letter
  */
  const onSearchType = async(stringToSearch: string) => {
    if(stringToSearch === "") {
      setStoreResponseSearchItem([]);
      setSearchItem([]);
      setItemSelected(false); //User erase the item selected
    } else {
      /* 
        If there is items in the array which we store the database's result, then 
        filter taking as a parameter the current input of the user
      */
      if(storeResponseSearchItem[0] !== undefined) {
        const re = new RegExp(`^${stringToSearch.toLowerCase()}[a-zA-Z0-9\ \d\D]*`);
        
        const itemToShow:IStructure[]&ISectional[] = [];

        for(let i = 0; i < storeResponseSearchItem.length; i++) {
          const item = storeResponseSearchItem[i];

          const geographicAreaName = `${item.geographic_area_name}`;
          const sectionalName = `${item.sectional_name}`;

            if(
              re.test(geographicAreaName.toLocaleLowerCase()) || 
              re.test(sectionalName.toLocaleLowerCase())
            ) {
              /* It may be the option that the user is searching */ 
              itemToShow.push(storeResponseSearchItem[i]);
            }
        }

        if(itemToShow[0] !== undefined) setSearchItem(itemToShow); //Show items
        else setSearchItem([]);  // There wasn't coincidences
      } else {
        // If the user doesn't still choose a option
        if(itemSelected === false) {
          // Search in DB according the current value of the input 
          const fullResponse:IStructure[]&ISectional[] = [];

          if(searchGeographicAreaPrivilege === true
            || addGeographicAreaPrivilege === true
            || updateGeographicAreaPrivilege === true
            || deleteGeographicAreaPrivilege === true) {
            //Search for geographic area according to the strategy
            const responseDataStrategy:IStructure[]&ISectional[] = 
              await searchItemByNameOption1(stringToSearch);
            
            // Set in the fullResponse the backend's response 
            for(let i = 0; i < responseDataStrategy.length; i++) {
              fullResponse.push(responseDataStrategy[i]);
            }
          }
          
          if(searchSectionalAreaPrivilege === true
          || updateSectionalArea === true) {
            //Search for sectionals
            const responseDataSectionals:IStructure[]&ISectional[] = 
              await searchItemByNameOption2(stringToSearch);

            // Set in the fullResponse the backend's response 
            /*
              To show the options we need to set an id for the sectional, this id
              can't overlap with geographic areas strategy id.

              At the moment, it was decided that it's going to use the negative numbers for
              secional areas options.

              The second option was an attempt to get a randomized number but it doesn't work
              
              A feature of the sectionals is that they area finte, opposite to the geographic areas
              that there is not a limit for create them
            */
            for(let i = 0; i < responseDataSectionals.length; i++) {
              const item:IStructure&ISectional = responseDataSectionals[i];
              fullResponse.push({
                id_geographic_area: item.id_sectional * -1
                  // (Math.ceil(item.id_sectional + JSON.parse(item.sectional_name) + randomNumber(10000)) / performance.now())
                  ,
                ...item
              });
            }
          }

          setStoreResponseSearchItem(fullResponse);
          setSearchItem(fullResponse);
        }
      }
    }
  }

  const selectOptionMember = async (idItem: number):Promise<void> => {
    const findDataItem:any = storeResponseSearchItem
      .find(item => item.id_geographic_area === idItem);
    
    //User selected an item
    setItemSelected(true);

    // Reset states
    setSearchItem([]);
    setStoreResponseSearchItem([]);

    //Return search results
    onSelectItem(findDataItem);
  }

  /* 
    This function helps to "set" the information that the user is going to see 
    in the inputs
   */
  const optionsToDisplay = ():IOption[] => {
    const itemsToDisplay:IOption[] = [];
    for(let i = 0; i < searchItem.length; i++) {
      const element = searchItem[i];
      if(searchItem[i].id_sectional === undefined) {
        itemsToDisplay.push({
          id: element.id_geographic_area !== undefined ? 
            element.id_geographic_area : 0,
          data: `${element.geographic_area_name} | ${
            element.zone_type === null ? "No tiene tipo de zona" : element.zone_type
          } - ${
            (element.first_name === null && element.last_name === null) ? "No tiene administrador" : `${element.first_name} ${element.last_name}`
          } - ${
            element.id_geographic_area
          }`
        })
      } else {
        itemsToDisplay.push({
          id: element.id_geographic_area !== undefined ? 
            element.id_geographic_area : 0,
          data: `${element.sectional_name} | Zona especial (seccional)`
        })

      }
    }
    return itemsToDisplay;    
  }

  return (
    <>
      <Searcher 
        placeholder="Buscar por area geografica o administrador"
        optionsToShow = { optionsToDisplay() }
        onSelectOption={ selectOptionMember }
        onType= { onSearchType }
      />
    </>

  );
}

export default SearchAllTypesGeographicAreas;