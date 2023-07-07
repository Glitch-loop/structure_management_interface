
const Button = ({
    label, 
    onClick, 
    colorButton = 0,
  }: {
    label: string, 
    onClick?: any|undefined,
    colorButton?: number,
  }) => {

    
    const getStyles = ():string => {
      let buttonColor = '';
      switch(colorButton) {
        case 0:
          buttonColor = 'z-0 mt-5 mx-3 bg-blue-200 rounded-full p-3 hover:bg-blue-400';
          break;
        case 1:
          buttonColor = 'z-0 mt-5 mx-3 bg-red-200 rounded-full p-3 hover:bg-red-400';
          break;
        case 2:
          buttonColor = 'z-0 mt-5 mx-3 bg-green-200 rounded-full p-3 hover:bg-green-400';
          break;
      }
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