
const Button = ({label, onClick}: {label: string, onClick?: any|undefined}) => {
  return (
    <button type="submit" onClick={(e:any) => onClick(e)} className='z-0 mt-5 mx-3 bg-blue-200 rounded-full p-3 hover:bg-blue-400'>
      {label}
    </button>
  )
}

export default Button;