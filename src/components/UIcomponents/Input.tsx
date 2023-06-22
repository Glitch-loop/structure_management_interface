import { useState } from "react"
import MessageAlert from "./MessageAlert"

const Input = (
  {
    onType, 
    inputValue, 
    inputName,
    inputType,
    required=false
  }: {
    onType: any, 
    inputValue: string
    inputName: string
    inputType: string
    required?: boolean
  }) => {
    const [showAlert, setShowAlert] = useState(false);

  return (
    <div>
      <input 
        className="w-full p-2 mt-5 text-gray-500 bg-slate-100 rounded-full outline outline-2 outline-slate-400 hover:outline-blue-400 focus:outline-slate-400"
        type={inputType}
        value={inputValue}
        onChange={(e) => {
          onType(e.target.value)
          setShowAlert(e.target.value!=='' ? false : true)
        }}
        placeholder={inputName}
      />
      {(showAlert && required) && 
        <MessageAlert label="El campo no puede estar vacío"/>}
    </div>
  )
}

export default Input;