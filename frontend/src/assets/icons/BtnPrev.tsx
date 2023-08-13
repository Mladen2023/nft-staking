import SVGIconWrapper from "./SVGIconWrapper";

function TitleBg(props:any) {
  return (
    <SVGIconWrapper width={30} height={30} {...props}>
      <rect x="0.5" y="0.5" width="29" height="29" rx="14.5" fill="#ABE4F7" fillOpacity="0.05"/>
      <path d="M16.9506 10L12 15L17 20" stroke="white" strokeOpacity="0.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="0.5" y="0.5" width="29" height="29" rx="14.5" stroke="#6A7394"/>
    </SVGIconWrapper>
  );
}

export default TitleBg;
