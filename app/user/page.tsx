'use client'

import { title } from "@/components/primitives";
import users from "@/constants/userData.json";
import { Button } from "@nextui-org/button";
import { useMemo } from "react";

// Hàm chuyển đổi ký tự có dấu thành không dấu
function removeAccents(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function UserPage() {
  const newUsers: any = useMemo(() => {
    return users?.map((user: any) => {
      const { firstName, lastName, passwordHash, team, manager, isDeleted, department, ...rest } = user;

      const field: any = {};

      if (firstName && lastName) {
        field['name'] = `${firstName} ${lastName}`.trim();
      }

      if (!firstName || !lastName) {
        field['name'] = String(firstName || lastName).trim();
      }

      if (!firstName && !lastName) {
        field['name'] = rest?.name?.trim() || null;
      }

      if (team && team?.length) {
        field['team'] = team?.map((item: any) => ({ $oid: item }))
      }

      if (!team) {
        field['team'] = [];
      }

      if (manager as any) {
        const position = Array.isArray(manager.position) && manager.position.length > 0 
          ? removeAccents(manager.position[0]).toLowerCase().replace(/\s+/g, '-') 
          : "";
        field['position'] = position;
        field['status'] = manager?.status === 1 ? true : false;
        field['jobEnd'] = manager?.jobEnd?.date || null;
        field['jobStart'] = manager?.jobStart?.date || null;
        field['note'] = manager?.note || "";
        field['telegramName'] = manager?.telegramName || "";
      }

      if (department) {
        field['department'] = { 
          $oid: department,
        };
      }

      return {
        ...rest,
        ...field,
        password: passwordHash,
        isDeleted: isDeleted || false,
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
     a.download = 'user.json';
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
  };

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
