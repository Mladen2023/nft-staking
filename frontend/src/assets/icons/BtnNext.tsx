import SVGIconWrapper from "./SVGIconWrapper";

function TitleBg(props:any) {
  return (
    <SVGIconWrapper width={30} height={30} {...props}>
      <rect x="-0.5" y="0.5" width="29" height="29" rx="14.5" transform="matrix(-1 0 0 1 29 0)" fill="#ABE4F7" fillOpacity="0.05"/>
      <path d="M13.0494 10L18 15L13 20" stroke="white" strokeOpacity="0.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="-0.5" y="0.5" width="29" height="29" rx="14.5" transform="matrix(-1 0 0 1 29 0)" stroke="#6A7394"/>
    </SVGIconWrapper>
  );
}

export default TitleBg;
