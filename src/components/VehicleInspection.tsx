import { useState, useRef, useEffect } from "react";
import { steps } from '../data/steps'

const VehicleInspection = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [photos, setPhotos] = useState<Blob[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Verifica se o usuário está usando um celular
    const userAgent = navigator.userAgent || navigator.vendor //|| (window as any).opera;
    
    setIsMobile(/android|ipad|iphone|ipod/.test(userAgent.toLowerCase()));

    if (isMobile) {
      // Obtém localização do usuário
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, [isMobile]);

  // Função para iniciar a câmera com base no `facingMode`
  const startCamera = async (facingMode: "user" | "environment") => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facingMode } // Define se será câmera frontal ou traseira
    });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
  };

  const handleTakePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(videoRef.current, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const photoURL = URL.createObjectURL(blob);
          setPhotoPreview(photoURL);
          setPhotos([...photos, blob]);
          setTimestamp(new Date().toLocaleString()); // Define a data e hora da foto
        }
      });
    }
  };

  const handleConfirmPhoto = () => {
    setPhotoPreview(null);
    setShowCamera(false);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    photos.forEach((photo, index) => {
      formData.append(`photo${index + 1}`, photo);
      formData.append(`location${index + 1}`, JSON.stringify(location)); // Adiciona localização
      formData.append(`timestamp${index + 1}`, timestamp || ""); // Adiciona data e hora
    });

    console.log(photos);
    
    await fetch("/api/submit-photos", {
      method: "POST",
      body: formData,
    });
  };

  const handleAdvanceToCamera = () => {
    if (!isMobile) {
      alert("Por favor, acesse esta página a partir de um dispositivo móvel.");
      return;
    }
    setShowCamera(true);
    const currentCamera = steps[currentStep].camera;
    startCamera(currentCamera as "user" | "environment"); // Iniciar câmera com base no passo
  };

  return (
    <div className="p-0">
      {/* <h1 className="text-xl">Vistoria Veicular</h1>
      <p>Código do Veículo: ABC123</p> */}

      {isMobile ? (
        photoPreview ? (
          // Exibir a foto tirada e opções de confirmação/refazer
          <div>
            <img src={photoPreview} alt="Prévia da foto" className="my-0 w-full h-screen object-cover" />
            <div className="fixed w-screen bottom-8 flex justify-center">
                <div className="flex flex-col">
                    <div className="flex gap-2 justify-center">
                        <button
                        onClick={handleConfirmPhoto}
                        className="bg-green-500 text-white px-4 py-2 rounded"
                        >
                        Avançar
                        </button>
                        <button
                        onClick={() => setShowCamera(true)}
                        className="bg-red-500 text-white px-4 py-2 rounded"
                        >
                        Refazer
                        </button> 
                    </div>
                    <div className="flex flex-col justify-center text-red-200 text-sm">
                        <p className="text-center">Data e Hora: {timestamp}</p>
                        <p className="text-center">Localização: Latitude {location?.latitude}, Longitude {location?.longitude}</p>
                    </div>
                </div>
            </div>
          </div>
        ) : showCamera ? (
          // Mostrar o que está sendo capturado pela câmera
          <div>
            <video ref={videoRef} className="w-full h-screen object-cover" autoPlay></video>
            <div className="fixed w-screen bottom-8 flex justify-center">
                <button
                onClick={handleTakePhoto}
                className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                Tirar foto
                </button>
            </div>
          </div>
        ) : (
          // Exibir o exemplo e botão de avançar para a câmera
          <div className="">
            <img src={steps[currentStep].example} alt="Exemplo de foto" className="my-0 h-screen" /> {/* my-4*/}
            {/* <p className="mb-2">
              {steps[currentStep].camera === "user" ? "Use a câmera frontal" : "Use a câmera traseira"}
            </p> */}
            <div className="fixed w-screen bottom-8 flex justify-center">
                <button
                onClick={handleAdvanceToCamera}
                className="bg-blue-500 text-white px-4 py-2 rounded  "
                >
                Avançar
                </button>
            </div>
          </div>
        )
      ) : (
        <div className="flex flex-col flex">
            <h2>Dispositivo não aceito!</h2>
            <p>Por favor, acesse esta página a partir de um dispositivo móvel.</p>
        </div>
      )}
    </div>
  );
};

export default VehicleInspection;
