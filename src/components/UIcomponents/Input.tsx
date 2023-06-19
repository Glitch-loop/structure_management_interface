
const Input = (
  {
    onType, 
    inputValue, 
    inputName,
    inputType
  }: {
    onType: any, 
    inputValue: string
    inputName: string
    inputType: string
  }) => {
  return (
    <input 
      className="w-full p-2 mt-5 text-gray-500 bg-slate-100 rounded-full outline outline-2 outline-slate-400 hover:outline-blue-400 focus:outline-slate-400"
      type={inputType}
      value={inputValue}
      onChange={(e) => onType(e.target.value)}
      placeholder={inputName}
    />
  )
}

export default Input;