
const Button = ({
    label, 
    onClick, 
    colorButton = 'bg-blue-200',
    colorButtonHover = 'bg-blue-400'
  }: {
    label: string, 
    onClick?: any|undefined,
    colorButton?: string,
    colorButtonHover?: string
  }) => {

    const getStyles = ():string => {
      return `z-0 mt-5 mx-3 ${colorButton} rounded-full p-3 hover:${colorButtonHover}`
    }
  return (
    <button 
      type="submit" 
      onClick={(e:any) => onClick(e)} 
      className={getStyles()}  
      >
      {label}
    </button>
  )
}

export default Button;