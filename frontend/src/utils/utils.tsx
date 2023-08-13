export function convertToFixedDecimals(amount:number) {
  if (typeof amount === 'string') {
    amount = Number(amount)
  }
  if (amount > 0.01) {
    return amount.toFixed(2)
  } else return String(amount)
}

export function convertToWei(amount:number) {
  if (typeof amount === 'string') {
    amount = Number(amount)
  }
  if (amount > 0.01) {
    return amount.toFixed(2)
  } else return String(amount)
}

export const changeBackgroundUrl = (url:string) => {
    document.documentElement.style.setProperty('--background-url', url);
}

export const copyClipboard = (data:string) => {
  navigator.clipboard.writeText(data)
    .then(() => {
      console.log('Text copied to clipboard');
    })
    .catch((error) => {
      console.error('Failed to copy text:', error)
    });
}

export const getDays = (seconds: number) => {
  let days:number = Math.floor(seconds/(60*60*24))
  return days;
}

export const getHours = (seconds: number) => {
  let hours:number = Math.floor(seconds/(60*60))
  return (hours % 24);
}

export const getMinutes = (seconds: number) => {
  let minutes:number = Math.floor(seconds/60)
  return (minutes % 60);
}

export const getSeconds = (seconds: number) => {
  return (seconds % 60);
}

export const todayInSeconds = (): number => {
  return Math.floor(Date.now() / 1000)
}