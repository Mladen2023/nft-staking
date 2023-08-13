import { useEffect, useState, useRef } from "react"
import { getDays, getHours, getMinutes, getSeconds } from "../utils/utils"
import { useAppStore } from "../store/app"

export default function AirdropProgress() {
  const app = useAppStore()

  const ref = useRef<HTMLDivElement>(null)
  const [leftTime, setLeftTime] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      if (app.airdropStarted) {
        let current_local_time = Math.floor(Date.now() / 1000)
        let left = (app.duration - app.currentTime + app.currentAirdropTime + app.localTime - current_local_time)
        left = Math.max(left, 0)
        if (ref.current) {
          ref.current.style.width = `${left*100/app.duration}%`
          if (left == 0) {
            ref.current.style.width = '0px'
          }
        }
        if (left > 0) {
          if (getDays(left) > 1) setLeftTime(`${getDays(left)+1} days`)
          else setLeftTime(`${getHours(left)}h ${getMinutes(left)}m ${getSeconds(left)}s`)
        } else {
          setLeftTime('')
        }
      } else {
        if (ref.current) {
          ref.current.style.width = `100%`
        }
        setLeftTime('')
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [ app.duration, app.currentTime, app.currentAirdropTime, app.localTime ])

  return (
    <div className="airdrop-progress relative flex">
      <div className="bg-bar absolute top-0 left-0"></div>
      <div className="fill-bar absolute top-0 left-0" ref={ref}></div>
      {!app.airdropStarted ? <div className="text">{'Airdrop not started'}</div> :
      <div className="text">{leftTime.length?`${leftTime} left`:'Airdrop time finished'}</div>}
    </div>
  )
}