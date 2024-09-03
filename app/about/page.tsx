import { title } from "@/components/primitives";
import { Button } from "@nextui-org/button";
import domainsBussiness from "@/constants/domain-bussiness.json";
import domainsKaizen from "@/constants/domains-kaizen.json";

export default function AboutPage() {
  const exportData = () => {
    const result = domainsBussiness.filter((item1: any) => 
      domainsKaizen.some((item2: any) => item1.id === item2.id)
    );
  }

  return (
    <div>
      <div className={title()}>
			  <h1>Export User Data
        </h1>
        
        <div className="">
          <Button color="primary" onPress={exportData}>Export</Button>
        </div>
      </div>
    </div>
  );
}
