import SVGIconWrapper from "./SVGIconWrapper";

function TitleBg(props:any) {
  return (
    <SVGIconWrapper width={530} height={16} {...props}>
      <path d="M265 1.13047e-05C411.355 4.90726e-06 530 2.8184 530 6.29507C530 9.77175 411.355 16 265 16C118.645 16 -2.72245e-07 9.77177 -4.24215e-07 6.2951C-5.76185e-07 2.81842 118.645 1.77021e-05 265 1.13047e-05Z" fill="url(#paint0_radial_10_98)"/>
      <defs>
        <radialGradient id="paint0_radial_10_98" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(265 6.29508) rotate(-0.0739776) scale(228.548 5.46518)">
          <stop stopColor="white"/>
          <stop offset="0.15625" stopColor="#CDFFF9"/>
          <stop offset="0.364583" stopColor="#36F3FF"/>
          <stop offset="0.479167" stopColor="#1470C6"/>
          <stop offset="0.677083" stopColor="#0819B5" stopOpacity="0.32"/>
          <stop offset="1" stopColor="#0842B5" stopOpacity="0"/>
        </radialGradient>
      </defs>
    </SVGIconWrapper>
  );
}

export default TitleBg;
