
const Button = ({
    label, 
    onClick, 
    colorButton = 0,
    style = "p-3",
  }: {
    label: string, 
    onClick?: any|undefined,
    colorButton?: number,
    style?: string
  }) => {

    
    const getStyles = ():string => {
      let buttonColor = '';
      switch(colorButton) {
        case 0:
          buttonColor = 'z-0 bg-blue-200 rounded-full p-3 hover:bg-blue-400';
          break;
        case 1:
          buttonColor = 'z-0 bg-red-200 rounded-full p-3 hover:bg-red-400';
          break;
        case 2:
          buttonColor = 'z-0 bg-green-200 rounded-full p-3 hover:bg-green-400';
          break;
      }
      buttonColor = buttonColor + " " + style;
      return buttonColor;
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