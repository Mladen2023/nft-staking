import { ReactNode } from "react"

export default function AliensBtn({
  children,
  className,
  title,
  onClick
}: {
  children: ReactNode
  className?: string
  title?: string
  onClick: any
}) {
  return (
    <div className={(className?className:"") + " aliens-btn"} onClick={onClick} title={title}>
      <span>{children}</span>
    </div>
  )
}