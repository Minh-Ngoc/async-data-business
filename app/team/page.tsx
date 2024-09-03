'use client'

import { title } from "@/components/primitives";
import teams from "@/constants/teams.json";
import { Button } from "@nextui-org/button";
import { useMemo } from "react";

// Hàm chuyển đổi ký tự có dấu thành không dấu
function removeAccents(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function UserPage() {
  const newUsers: any = useMemo(() => {
    return teams?.map((brand: any) => {
      const { _id, name, createdAt, updatedAt, __v } = brand;

      return {
        _id,
        name,
        createdAt,
        updatedAt,
        __v,
      }
    })
  }, []);

  const exportData = () => {
     // Bước 1: Chuyển đổi trạng thái người dùng thành chuỗi JSON
     const userJson = JSON.stringify(newUsers, null, 2);

     // Bước 2: Tạo một đối tượng Blob từ chuỗi JSON
     const blob = new Blob([userJson], { type: 'application/json' });
 
     // Bước 3: Tạo một liên kết tạm thời để tải xuống tệp Blob dưới dạng tệp JSON
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = 'team.json';
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className={title()}>
			  <h1>Export Team Data
        </h1>
        
        <div className="">
          <Button color="primary" onPress={exportData}>Export</Button>
        </div>
      </div>
    </div>
  );
}
