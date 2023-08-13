import { CountUp } from 'use-count-up';
export default function InfoCard ({ 
  value, 
  label,
  isUsd,
}: {
  value: number,
  label: string,
  isUsd?: boolean
}) {
  const decimalPlaces = 0;
  const countUpProps = {
    isCounting: true,
    start: 0,
    end: value,
    duration: 3,
    shouldUseToLocaleString: true,
    toLocaleStringParams: {
      locale: undefined, 
      options: {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
      }
    },
    prefix: "",
    suffix: "",
    decimalPlaces,
    thousandsSeparator: '',
    decimalSeparator: '',
    formatter: (value: number) => kFormatter(value),
  }

  const kFormatter = (num: number) => {
    const suffixes = ["", "K", "M", "B", "T"]
    let suffixIndex  = 0
    num = parseInt(Math.abs(num).toFixed(0))
    while (num >= 1000 && suffixIndex  < suffixes.length - 1) {
        num = parseFloat((Math.abs(num) / 1000).toFixed(2))
        suffixIndex ++
    }
    if (isUsd) return `$${num}${suffixes[suffixIndex]}`;
    return `${num}${suffixes[suffixIndex]}`;
  }


  return (
    <div className="info-card flex flex-col">
      <CountUp {...countUpProps}>
        {({ value }: { value: number }) => (
          <div className="card-value">
            {value}
          </div>
        )}
      </CountUp>
      <div className="card-label">
        {label}
      </div>
    </div>
  )
}
