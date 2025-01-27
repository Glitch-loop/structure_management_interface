import { useState } from 'react'
import { ISectional, IRequest } from "../../interfaces/interfaces"
import SearchSectionals from "../Searchers/SearchSectionals"
import Button from '../UIcomponents/Button';
import Input from '../UIcomponents/Input';
import { avoidNull } from '../../utils/utils';
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch } from 'react-redux';
import requester from '../../helpers/Requester';

const responseError:IRequest<undefined> = {
  message: "Internal error",
  data: undefined,
  code: 500
}

/*
  This sectional is just to manage the sectionals (if where the members where they need to go
  to vote change or if the amount of members to have grow or decreses)
*/

const SectionalManageComponent = () => {
  // Operational state
  const [ sectionalSelected, setSectionalSelected ] = useState<ISectional|undefined>(undefined);

  const dispatch:Dispatch<AnyAction> = useDispatch();

  //API calls
  // Operational calls
  const updateSectional = async (sectional: ISectional):Promise<IRequest<undefined>> => {
    try {
      const data = {
        sectionalAdress: sectional.sectional_address,
        membersTarget: sectionalSelected?.target_members

      }

      const response:IRequest<undefined> = await requester({
        url: `/sectionals/${sectional.id_sectional}`,
        method: 'PUT',
        data
      })
      
      if(response.code === 200) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.success, 
          message: "Se ha actualizado el seccional correctamente"}}));  
      }
      if(response.code === 400) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.warning, 
          message: "Ha habido un error al intentar actualizar el seccional, intente nuevamente"}}));  
      }
        return response;

    } catch (error) {
      dispatch(enqueueAlert({alertData: {
        alertType: EAlert.error, 
        message: "Hubo un error al intentar conectarse al servidor"}}));
        return responseError;
    }
  }

  //Handlers
  const onSelectSectional = async (sectional: ISectional):Promise<void> => {
    // Avoid null values
    sectional.sectional_address = avoidNull(sectional.sectional_address, "");
    sectional.target_members = avoidNull(sectional.target_members, 0);
    
    setSectionalSelected(sectional)
  }

  const onUpdateSectional = async ():Promise<void> => {
    if(sectionalSelected !== undefined) {
      const response:IRequest<undefined> = await updateSectional(sectionalSelected);

      if(response.code === 200) {
        setSectionalSelected(undefined);
      }
    }
  }

  return (
    <>
      <div className='flex flex-row items-center'>
        <div className='mr-3'>
          <div>
            <SearchSectionals onSelectItem={onSelectSectional}/>
            { sectionalSelected !== undefined && 
            <div className='flex justify-center'>
              <div className="flex flex-col w-72 justify-center">
                <div className="mr-2">
                  <Input
                    onType={setSectionalSelected}
                    objectValue={sectionalSelected} 
                    inputName={"sectional_address"}
                    placeholder={'Dirección de casilla'}
                    inputType={'text'}
                    required={true}
                  />
                </div>
                <Input
                  onType={setSectionalSelected}
                  objectValue={sectionalSelected} 
                  inputName={"target_members"}
                  placeholder={'Miembros objetivo a tener'}
                  inputType={'text'}
                  testRegex={new RegExp(/^\d*$/, 's')}
                  testMessage={"Debe de ser un numero"}
                />

                <Button 
                  label={'Actualizar'}
                  onClick={onUpdateSectional}
                  style={'m-3'}
                />
              </div>
            </div>
            }
          </div>
        </div>
      </div>
    </>
  )
}

export default SectionalManageComponent
