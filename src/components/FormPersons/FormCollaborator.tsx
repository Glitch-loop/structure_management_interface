import { useEffect, useState } from "react";
import Input from "../UIcomponents/Input";
import { Autocomplete, TextField, Checkbox, Dialog } from "@mui/material";
import Button from "../UIcomponents/Button";

//Interfaces for members

// Interfaces for collaborators
import { ICollaborator, IPrivilege, IRequest } from "../../interfaces/interfaces";

//Interfaces for both
import { IColony } from "../../interfaces/interfaces";

import requester from "../../helpers/Requester";
import Chip from "@mui/material/Chip";
import { EAlert } from "../../interfaces/enums";
import { enqueueAlert } from "../../redux/slices/appSlice";
import { Dispatch, AnyAction } from 'redux';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import MessageAlert from "../UIcomponents/MessageAlert";
import { CircularProgress } from "@mui/material";

//Initial states
const initialPersonState:ICollaborator = {
  id_collaborator: 0,
  first_name: "",
  last_name: "",
  street: "",
  ext_number: "", 
  int_number: "",
  cell_phone_number: "",
  id_colony: 0,
  colony_name: "",
  postal_code: "",
  email: "",
  password: "",
  privileges: []
}

//Response
const errorResponse:IRequest<undefined> = {
  message: "Error",
  code: 500
}

//Auxiliar functions
const avoidNull = (data: any, replace: any):any => {
  return data === null ? replace : data;
}

const getArrPrivilegesSelected = (privileges: IPrivilege[]):number[] => {
  const data:number[] = [];
  privileges.forEach(privilege => {
    if(privilege.assigned === true) {
      data.push(privilege.id_privilege);
    }
  });

  return data;
}

/*
  action props
  0 = add collaborator
  1 = update collaborator
  2 = update profile
*/

const FormCollaborator = (
  {
    label,
    action,
    handleSubmit,
    initialPersonInformation = initialPersonState,
  }: {
    label: string,
    action: number,
    handleSubmit?: any;
    initialPersonInformation?: ICollaborator, 
  }) => {
    //useState states ---
    //Common fileds
    const [person, setPerson] = useState<ICollaborator>(initialPersonInformation);
    const [privileges, setPrivileges] = useState<IPrivilege[]>([]);
    const [helper, setHelper] = useState<boolean>(false);
    //Operational input 
    const [confirmPassword, setConfirmPassword] = useState<any>({password: ''})
    const [showDialog, setShowDialog] = useState<boolean>(false)

    //States to save the results of the search
    const [arraySearchColony, setArraySearchColony] = useState<IColony[]>([])
    
    //Show data

    //Reducers to alerts
    const dispatch:Dispatch<AnyAction> = useDispatch();
    const userData = useSelector((state: RootState) => state.userReducer)

    // useEffect procedure ---
    useEffect(() => {
      getAllPrivileges().then((privileges) => {

        if(action === 0) {
          /*
            If action is 0, that means that the user is adding a new collaborator,
            so he doesn't have privileges yet.
          */ 
          setPrivileges(
            privileges.map(privilege => {privilege.assigned = false; return privilege}));
          } else if(action === 1) {
            /*
              If action is 1, that means that the user us updating a new collaborator,
              so we set as cheked those privileges that the collaborator already has.
            */ 
            if(person.privileges !== undefined) {
              const currentPrivileges:IPrivilege[] = person.privileges;
              setPrivileges(
                privileges
                .map(privilege => {
                  if ((currentPrivileges.find(currentPrivilege => 
                      currentPrivilege.id_privilege === privilege.id_privilege)) !== undefined) {
                        privilege.assigned = true; 
                      } else {
                        privilege.assigned = false; 
                      }
                  return privilege
                }));
            } else setPrivileges(privileges)
        }
        setHelper(!helper)
      })
    }, [])


    //Calls to API
    const getAllPrivileges = async ():Promise<IPrivilege[]> => {
      try {
        const response: IRequest<IPrivilege[]> = await requester({
          url: `/privileges`,
          method: 'GET',
        })
        if(response.code === 200) {
          if(response.data !== undefined) return response.data;
        } else {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "Hubo un error al intentar obtener los privilegios, intente mas tarde"}})); 
        }
        return [];
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar contectar con el servidor, intente mas tarde"}}));
        return [];
      }
    }

    const searchColonies = async (colonyToSearch: string):Promise<IColony[]> => {
      try {
        const response: IRequest<IColony[]> = await requester({
          url: `/colonies/name/${colonyToSearch}`,
          method: 'GET',
        })
        if(response.code === 200) {
          if(response.data !== undefined) return response.data;
        } else {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
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

    const addNewMember = async (collaborator: ICollaborator):Promise<IRequest<any>> => {
      try {
        const response: IRequest<any> = await requester({
          url: `/collaborators`,
          method: 'POST',
          data: collaborator
        })

          if(response.message == "You are trying to create a new collaborator with data repeated (full name, email or cellphone number)") {
            dispatch(enqueueAlert({alertData: {
              alertType: EAlert.warning, 
              message: "Hubo un error al momento de crear el colaborador, el correo, nombre completo o numero telefonico se repite con el de otro"}})); 
          } else if(response.message === "Invalid format for cellphone number, valid formats: xx-xxxx-xxxx or xxx-xxx-xxxx") {
            dispatch(enqueueAlert({alertData: {
              alertType: EAlert.warning, 
              message: "Formato invalido para el telefono"}})); 
          } else if (response.message === "Invalid format for email, example of valid format: someone@gmail.com") {
            dispatch(enqueueAlert({alertData: {
              alertType: EAlert.warning, 
              message: "Formato invalido para el email"}}));             
          } else if(response.message === "Invalid password, the password must contain: Minimum eight characters, One uppercase letter, One lowercase letter, One number, One special charatcer: @$!%*?&") {
              dispatch(enqueueAlert({alertData: {
                alertType: EAlert.warning, 
                message: "La contraseña no cumple con los requisitos"}})); 
          } else {
              dispatch(enqueueAlert({alertData: {
                alertType: EAlert.warning, 
                message: "Hubo un error al intentar agregar al nuevo colaborador, intente mas tarde"}})); 
          }
        
        return response;
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar conectar con el servidor, intente mas tarde"}}));
        return errorResponse;
      }
    }

    const updateCollaborator = async(idCollaborator: number, collaborator: ICollaborator):Promise<IRequest<any>> => {
      try {
        const response: IRequest<any> = await requester({
          url: `/collaborators/${idCollaborator}`,
          method: 'PUT',
          data: collaborator
        })
        if(response.code === 200) {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.success, 
            message: "Se ha actualizado exitosamente el colaborador"}})); 
        } else {
          if(response.message == "You are trying to create a new collaborator with data repeated (full name, email or cellphone number)") {
            dispatch(enqueueAlert({alertData: {
              alertType: EAlert.warning, 
              message: "Hubo un error al momento de crear el colaborador, el correo, nombre completo o numero telefonico se repite con el de otro"}})); 
              
            } else {
            dispatch(enqueueAlert({alertData: {
              alertType: EAlert.warning, 
              message: "Hubo un error al intentar agregar al nuevo colaborador, intente mas tarde"}})); 
          }
        }
        return response;
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar conectar con el servidor, intente mas tarde"}}));
        return errorResponse;
      }
    }

    const updatePrivileges = async (collaborator: number, privileges: number[]):Promise<IRequest<any>> => {
      try {
        const response: IRequest<any> = await requester({
          url: `/privileges/${collaborator}`,
          method: 'PUT',
          data: {privileges: privileges}
        })
        if(response.message === "Only a super admin can grant the privilege for create another super admin") {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "Solo un super administrador puede otorgar privilegios de super administrador"}})); 
        } else if(response.message === "Only a super admin can revoke the privilege for delete other super admin"){
            dispatch(enqueueAlert({alertData: {
              alertType: EAlert.warning, 
              message: "Solo un super administrador puede revocar privilegios de administrador"}}));             
        } else if(response.message === "You cannot revoke any privileges, rather than 'super admin privilege' for a superadmin"){ 
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "No se puede revocar privilegios a un super administrador (solo se pude revocar los privilegios de super administrador)"}})); 
        } else if(response.message === "The user does not have privileges enough"){
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "No tienes suficientes privilegios para poder modificar o eliminar privilegios"}})); 
        } else {
            if(response.code === 400) {
              dispatch(enqueueAlert({alertData: {
                alertType: EAlert.warning, 
                message: "Hubo un error al intentar actualizar los privilegios del colaborador, intente mas tarde"}})); 
            }
        }
        return response;
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar conectar con el servidor, intente mas tarde"}}));
        return errorResponse;
      }
    }

    const resetPassword = async (idCollaborator: number):Promise<IRequest<any>> => {
      try {
        const response: IRequest<any> = await requester({
          url: `/collaborators/resetPassword/${idCollaborator}`,
          method: 'PUT'
        })
        if(response.code === 200) {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.success, 
            message: "Se ha restaurado la contraseña del colaborador exitosamente"}})); 
        } else {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "Hubo un error al intentar restaurar la constraseña del colaborador, intente mas tarde"}})); 
        }
        return response;
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar conectar con el servidor, intente mas tarde"}}));
        return errorResponse;
      }
    }

    const updatePassword = async (password: string):Promise<IRequest<any>> => {
      try {
        const response: IRequest<any> = await requester({
          url: `/collaborators/password/change`,
          method: 'PUT',
          data: {password: password}
        })
        console.log(response)
        if(response.code === 200) {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.success, 
            message: "Se ha actualizado la contraseña del colaborador exitosamente"}})); 
        }

        if(response.message === "Invalid password, the password must contain: Minim…etter, One number, One special charatcer: @$!%*?&") {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "La contraseña no cumple con los requisitos"}})); 
        } else {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "Hubo un error al intentar restaurar la constraseña del colaborador, intente nuevamente"}})); 
        }

        return response;
      } catch (error) {
        dispatch(enqueueAlert({alertData: {
          alertType: EAlert.error, 
          message: "Hubo un error al intentar conectar con el servidor, intente mas tarde"}}));
        return errorResponse;
      }
    }

    //Handlers basic information ---
    //Handlers for colony autocomplete
    const handleSearchColony = async (event: any, newInputValue: string | null) => {
      if(newInputValue !== null) {
        //Save the current user's search
        setPerson({...person, colony_name: newInputValue}) 
        //If the user doesn't search anything, delete the current results 
        if(newInputValue==='') setArraySearchColony([]) 

        /*
          If the array of results is empty and the user is searcher something, 
          make a request to backend to search what the user is searching.
        */
        if(arraySearchColony[0] === undefined && newInputValue !== '') 
          setArraySearchColony(await searchColonies(newInputValue))
        
      }
    }

    const handleSelectColony = async (event: any, newInputValue: string | null) => {
      // Search through the name, the colony that the user selected
      const colonySelected:IColony|undefined = arraySearchColony
      .find(searchColony => searchColony.name_colony === newInputValue);

      /*
        If the colony wasn't founded, reset the fields in the state, otherwise
        save the ID and name of the colony selected
      */
      if(colonySelected===undefined) setPerson({...person, id_colony: 0, colony_name: ""});
      else 
        setPerson({
          ...person, 
          id_colony: colonySelected.id_colony, 
          colony_name: colonySelected.name_colony});
    }

    //Handlers boxes
    const handleClick = (id_privilege:number|undefined) => {
      if(id_privilege !== undefined) {
        const index:number|undefined = privileges
          .findIndex(privilege => privilege.id_privilege === id_privilege)
        
        privileges[index].assigned = !privileges[index].assigned ;
        setPrivileges(privileges);
        setHelper(!helper)
      }
    }


    //Handle to submit ---
    //Handle password
    const handleOnSubmit = async(e: any) => {
      e.preventDefault();
      console.log(person.password)
      console.log(confirmPassword.password)
      //Verify all the data is in the body to be send
      if(
        person.first_name === '' ||
        person.last_name === '' ||
        person.street === '' ||
        person.ext_number === '' ||
        person.cell_phone_number === '' ||
        person.email === '' ||
        person.id_colony === undefined
        ){
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "Llena todos los campos obligatorios"}}));
          return;
      }

      if(person.ext_number !== undefined) {
        if(person.ext_number.length > 5) {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "El numero externo no puede ser mayor a 5 caracteres"}}));
          return;
        }
      }

      if(person.int_number !== undefined) {
        if(person.int_number.length > 5) {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "El numero interno no puede ser mayor a 5 caracteres"}}));
          return;
        }
      }

      const basicData = {
        "idCollaborator": avoidNull(person.id_collaborator, 0),
        "firstName": avoidNull(person.first_name, ""),
        "lastName": avoidNull(person.last_name, ""),
        "street": avoidNull(person.street, ""),
        "extNumber": avoidNull(person.ext_number, ""),
        "intNumber": avoidNull(person.int_number, ""),
        "email": avoidNull(person.email, ""),
        "idColony": avoidNull(person.id_colony, 0),
        "cellPhoneNumber": avoidNull(person.cell_phone_number, ""),
        "password": avoidNull(person.password, "")
      }


        if(action==0) {
          if(person.password === '' ||
          confirmPassword === '') {
            dispatch(enqueueAlert({alertData: {
              alertType: EAlert.warning, 
              message: "Llena todos los campos obligatorios"}}));
            return;
          }
          if(person.password != confirmPassword.password) {
            dispatch(enqueueAlert({alertData: {
              alertType: EAlert.warning, 
              message: "No coinciden las contraseñas"}}));
            return;
          }

          const responseAddMember:IRequest<any> = await addNewMember(basicData);
          console.log(responseAddMember)
          if(responseAddMember.code === 201 && responseAddMember.data !== undefined) {
            dispatch(enqueueAlert({alertData: {
              alertType: EAlert.success, 
              message: "Se ha agregado exitosamente el nuevo colaborador"}})); 
            const { idCollaborator } = responseAddMember.data;
            if(privileges[0] !== undefined) {
              const responsePrivilege:IRequest<any> 
                = await updatePrivileges(idCollaborator, 
                  getArrPrivilegesSelected(privileges));
              if(responsePrivilege.code === 200) {
                dispatch(enqueueAlert({alertData: {
                  alertType: EAlert.success, 
                  message: "Se ha actualizado exitosamente los privilegios del colaborador"}})); 
              }
              resetAllStates();
            }
          }
        } else if(action==1) {
          const response:IRequest<any> = 
            await updateCollaborator(basicData.idCollaborator, basicData);
          const responsePrivilege:IRequest<any> 
          = await updatePrivileges(basicData.idCollaborator, 
            getArrPrivilegesSelected(privileges));
          console.log(responsePrivilege)
          if(response.code === 200) {
              resetAllStates();
              handleSubmit(true)
          }
        } else if(action==2) {
          const response:IRequest<any> = 
          await updateCollaborator(basicData.idCollaborator, basicData);
        }

        // setPerson(initialPersonState)
    }
    
    //This function is to reset the password
    const handleSubmitResetPassword = async(e:any):Promise<void> => {
      e.preventDefault();
      let response:IRequest<any> = {
        code: 400,
        message: ""
      };

      if(action === 1) {
        //This is to recover a password, reseting it
        if(person.id_collaborator !== undefined)
         response = await resetPassword(person.id_collaborator);
      } else {
        console.log(person.password)
        if(person.password === undefined){
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "La contraseña no puede estar vacía"}})); 
        }

        if(person.password !== confirmPassword.password) {
          dispatch(enqueueAlert({alertData: {
            alertType: EAlert.warning, 
            message: "Las contraseñas tienen que concidir"}})); 
        }
        //This is when a user wants to update his password
        if(person.password !== undefined)
          response = await  updatePassword(person.password)
      }

      console.log("Hola")    
      if(response.code === 200) {
        setShowDialog(true);
        action == 1 &&
          setPerson({...person, password: response.data.password});
        setConfirmPassword({password: ''})
      }
    
    }

    //This function is to close the dialog (the function remove the password)
    const handleCloseDialog = ():void => {
      setShowDialog(false)
      setPerson({...person, password: ''})
    }
    
    //Auxiliar functions
    const resetAllStates = ():void => {
      //Basic information states related
      setPerson(initialPersonState);
      setConfirmPassword({password: ''});

      //Autocomplete store data states related
      setArraySearchColony([])
      setPrivileges([]);
      
    }


  return (
    <>
      <Dialog 
        onClose={() => handleCloseDialog()}
        open={showDialog}>
          <div className="p-5 flex flex-col">
            <p className="mb-3 text-center text-xl">Nueva contraseña del colaborador</p>
            <p className="mb-3 ml-4 italic">
              Contraseña: <span className="text-lg font-bold not-italic">{person.password}</span>
            </p>
            {
              action == 1 &&
              <p className="mb-3 font-bold">
                Es importante que el colaborador entre al perfil 
                con la nueva contraseña y cambie esta contraseña 
                por una que el propio colaborador invente.
              </p>
            }
            {
              action == 2 &&
              <p className="mb-3 font-bold">
                Esta contraseña es privada, no la compartas con nadie, en caso de que 
                sepas que tu contraseña ha sido comprometida cambiala de inmediatamente o
                avisa a tu administrador
              </p>
            }
            <Button 
              label="Aceptar"
              onClick={() => handleCloseDialog()}
              />
          </div>
      </Dialog>
      <div className="text-center text-xl font-bold">
        {label}
      </div>
      <form>
        <div className="flex flex-row">
          <div className="mt-3 mr-3">
            <div className="flex flex-row">
              <div className="mr-2">
                <Input
                  onType={setPerson}
                  objectValue={person} 
                  inputName={"first_name"}
                  placeholder={'Nombre(s)'}
                  inputType={'text'}
                  required={true}
                />
              </div>
              <Input
                onType={setPerson}
                objectValue={person} 
                inputName={"last_name"}
                placeholder={'Apellidos'}
                inputType={'text'}
                required={true}
              />
            </div>
            <div className="flex flex-row justify-center">
              <Input
                onType={setPerson}
                objectValue={person} 
                inputName={"street"}
                placeholder={'Calle'}
                inputType={'text'}
                required={true}
              />
            </div>
            <div className="flex flex-row">
              <div className="mr-2">
                <Input
                  onType={setPerson}
                  objectValue={person} 
                  inputName={"ext_number"}
                  placeholder={'No. Exterior'}
                  inputType={'text'}
                  required={true}
                  testRegex={new RegExp(/^.{1,5}$/, 's')}
                  testMessage={"EL numero exterior no puede ser mayor a 5 caracteres"}
                />
              </div>
              <Input
                onType={setPerson}
                objectValue={person} 
                inputName={"int_number"}
                placeholder={'No. Interno (opcional)'}
                inputType={'text'}
                testRegex={new RegExp(/^.{1,5}$/, 's')}
                testMessage={"EL numero interior no puede ser mayor a 5 caracteres"}
              />
            </div>
            <div className="flex flex-row justify-center">
              <Input
                  onType={setPerson}
                  objectValue={person} 
                  inputName={"cell_phone_number"}
                  placeholder={'Telefono'}
                  inputType={'text'}
                  required={true}
                  testRegex={new RegExp(/(^\d{2}\-\d{4}\-\d{4}$)|(^\d{3}\-\d{3}\-\d{4}$)/, 's')}
                  testMessage={"Formatos validos: xx-xxxx-xxxx or xxx-xxx-xxxx"}
                />
            </div>
            <div className="flex mt-3 justify-center">
              <Autocomplete
                disablePortal
                id="combo-box-demo"
                onInputChange={(event: any, newInputValue: string | null) => 
                   handleSearchColony(event, newInputValue) }
                onChange={(event: any, newValue: any) => handleSelectColony(event, newValue) }
                value={person.colony_name}
                options={ 
                  arraySearchColony.map((searchColony => searchColony.name_colony)) 
                }
                sx={{ width: 300 }}
                renderInput={(params) => <TextField {...params} label="Colonia" />}
                />
            </div>
            <div className="flex flex-row justify-center">
              <div className="mr-2">
                <Input
                  onType={setPerson}
                  objectValue={person} 
                  inputName={"email"}
                  placeholder={'email'}
                  inputType={'text'}
                  testRegex={new RegExp(/^([a-z]|[A-Z]|[0-9]|\.|\-)+\@([a-z])+.(com)$/, 's')}
                  testMessage={"Formatos validos: ejemplo@gmail.com"}
                  required={true}
                />
              </div>
            </div>
            {(action == 0 || action === 2) &&
            <div className="flex flex-col flex-center">
              <div className="flex flex-row">
                <div className="mr-2">
                  <Input
                    onType={setPerson}
                    objectValue={person} 
                    inputName={"password"}
                    placeholder={'Contraseña'}
                    inputType={'text'}
                    testRegex={new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 's')}
                    testMessage={"La contraseña debe contener minimo: 8 caracteres (en conjunto debe de cumplir); 1 mayuscula, 1 minuscula, un numero y un caracter especial (@$!%*?&)"}
                  />
                </div>
                <Input
                  onType={setConfirmPassword}
                  objectValue={confirmPassword} 
                  inputName={"password"}
                  placeholder={'Contraseña'}
                  inputType={'text'} 
                />
              </div>
              {
                (
                  confirmPassword?.password !== person.password
                ) &&
                <MessageAlert label="Las contraseñas tienen que coincidir" />
              }
            </div>
            }
          </div>
          {privileges[0] !== undefined &&
            <div className="mt-3 ml-3 overflow-scroll max-h-96">
              <div className="max-w-lg">
                <p className="text-lg font-medium">Privilegios de capturista</p>
                <div className="flex flex-row flex-wrap">
                  {
                    privileges.filter(privilege => {
                      if(
                        privilege.id_privilege === 1 ||
                        privilege.id_privilege === 2 ||
                        privilege.id_privilege === 3 ||
                        privilege.id_privilege === 14 ||
                        privilege.id_privilege === 15 ||
                        privilege.id_privilege === 16
                        ) return privilege
                    })
                    .map(privilege => 
                      <div 
                      key={privilege.id_privilege} 
                      className="flex flex-row items-center">
                        <Checkbox     
                          onClick={(e:any)=>{handleClick(privilege.id_privilege)}}
                          checked={privilege.assigned}
                        />
                        <p className="text-sm">{privilege.name_privilege}</p>
                      </div>
                      )
                  }
                </div>
              </div>
              <div className="max-w-lg">
                <p className="text-lg font-medium">Privilegios de planificador</p>
                <div className="flex flex-row flex-wrap">
                  {
                    privileges.filter(privilege => {
                      if(
                        privilege.id_privilege === 7 ||
                        privilege.id_privilege === 8 ||
                        privilege.id_privilege === 17 ||
                        privilege.id_privilege === 18
                        ) return privilege
                    })
                    .map(privilege => 
                      <div 
                      key={privilege.id_privilege} 
                      className="flex flex-row items-center">
                        <Checkbox     
                          onClick={()=>{handleClick(privilege.id_privilege)}}
                          checked={privilege.assigned}
                        />
                        <p className="text-sm">{privilege.name_privilege}</p>
                      </div>
                      )
                  }
                </div>
              </div>
              <div className="max-w-lg">
              <p className="text-lg font-medium">Privilegios de arquitecto</p>
                <div className="flex flex-row flex-wrap">
                  {
                    privileges.filter(privilege => {
                      if(
                        privilege.id_privilege === 4 ||
                        privilege.id_privilege === 5 ||
                        privilege.id_privilege === 6
                        ) return privilege
                    })
                    .map(privilege => 
                      <div 
                      key={privilege.id_privilege} 
                      className="flex flex-row items-center">
                        <Checkbox     
                          onClick={()=>{handleClick(privilege.id_privilege)}}
                          checked={privilege.assigned}
                        />
                        <p className="text-sm">{privilege.name_privilege}</p>
                      </div>
                      )
                  }
                </div>
              </div>
              <div className="max-w-lg">
              <p className="text-lg font-medium">Privilegios de analista</p>
                <div className="flex flex-row flex-wrap">
                  {
                    privileges.filter(privilege => {
                      if(
                        privilege.id_privilege === 20 ||
                        privilege.id_privilege === 21 ||
                        privilege.id_privilege === 22 ||
                        privilege.id_privilege === 23 ||
                        privilege.id_privilege === 24 ||
                        privilege.id_privilege === 25 ||
                        privilege.id_privilege === 26 ||
                        privilege.id_privilege === 27 ||
                        privilege.id_privilege === 28
                        ) return privilege
                    })
                    .map(privilege => 
                      <div 
                      key={privilege.id_privilege} 
                      className="flex flex-row items-center">
                        <Checkbox     
                          onClick={()=>{handleClick(privilege.id_privilege)}}
                          checked={privilege.assigned}
                        />
                        <p className="text-sm">{privilege.name_privilege}</p>
                      </div>
                      )
                  }
                </div>
              </div>
              <div className="max-w-lg">
              <p className="text-lg font-medium">Privilegios de administrador</p>
                <div className="flex flex-row flex-wrap">
                  {
                    privileges.filter(privilege => {
                      if(
                        privilege.id_privilege === 9 ||
                        privilege.id_privilege === 10 ||
                        privilege.id_privilege === 11
                        ) return privilege
                    })
                    .map(privilege => 
                      <div 
                      key={privilege.id_privilege} 
                      className="flex flex-row items-center">
                        <Checkbox     
                          onClick={()=>{handleClick(privilege.id_privilege)}}
                          checked={privilege.assigned}
                        />
                        <p className="text-sm">{privilege.name_privilege}</p>
                      </div>
                      )
                  }
                </div>
              </div>
              <div className="max-w-lg">
              <p className="text-lg font-medium">Privilegios de super administrador</p>
                <div className="flex flex-row flex-wrap">
                  {
                    privileges.filter(privilege => {
                      if(
                        privilege.id_privilege === 12 ||
                        privilege.id_privilege === 13 ||
                        privilege.id_privilege === 19
                        ) return privilege
                    })
                    .map(privilege => 
                      <div 
                      key={privilege.id_privilege} 
                      className="flex flex-row items-center">
                        <Checkbox     
                          onClick={()=>{handleClick(privilege.id_privilege)}}
                          checked={privilege.assigned}
                        />
                        <p className="text-sm">{privilege.name_privilege}</p>
                      </div>
                      )
                  }
                </div>
              </div>
            </div>
          }
        </div>
        <div className="flex flex-row justify-center">
        <Button label="Aceptar" onClick={(e:any) => {handleOnSubmit(e)}}/>          
        {
          (action===1) && 
            <Button 
              label="Cancelar" 
              onClick={() => {
                handleSubmit(true)
              }}
              colorButton={1}
              />
        }
        {
          (action===1 || action===2) && 
            <Button 
              label={action===1 ? "Restablecer contraseña" : "Actualizar contraseña"}
              onClick={(e:any) => {
                handleSubmitResetPassword(e);
              }}
              colorButton={2}
              />
        }
        </div>  
      </form>
    </>
  )
}

export default FormCollaborator;