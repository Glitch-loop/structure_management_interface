import { useState } from "react"
import MessageAlert from "./MessageAlert"

const Input = (
  {
    onType, 
    objectValue, 
    placeholder,
    inputName,
    inputType,
    required=false,
    testRegex='',
    testMessage='Hay un error con el input'
  }: {
    onType: any, 
    objectValue: any
    placeholder: string
    inputName: string
    inputType: string
    required?: boolean
    testRegex?: any
    testMessage?:string
  }) => {
    const [showAlert, setShowAlert] = useState(false);
    const [showAlertTest, setShowAlertTest] = useState(false);

    const testFunction = (textCase: string):void => {
      if(testRegex!='' && textCase != ''){
        if(!(testRegex.test(textCase))) setShowAlertTest(true)
        else setShowAlertTest(false)
      } else setShowAlertTest(false)
    }

  return (
    <div>
      <input 
        className="w-full p-2 mt-5 text-gray-500 bg-slate-100 rounded-full outline outline-2 outline-slate-400 hover:outline-blue-400 focus:outline-slate-400"
        type={inputType}
        value={objectValue[inputName]}
        name={inputName}
        onChange={(e) => {
          // const item = {
          //   [e.target.name]: e.target.value
          // }
          
          onType({...objectValue, [e.target.name]: e.target.value})
          console.log()
          
          setShowAlert(e.target.value!=='' ? false : true)
        }}
        onBlur={(e) => { testFunction(e.target.value)} }
        placeholder={placeholder}
      />
      {(showAlert && required) && 
        <MessageAlert label="El campo no puede estar vacío"/>}
      {(showAlertTest) && 
        <MessageAlert label={testMessage}/>}
    </div>
  )
}

export default Input;