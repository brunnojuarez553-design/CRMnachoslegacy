import { NextResponse } from "next/server";
import { z } from "zod";
import { requireWorkspace, ApiError } from "@/lib/internal-auth";
import { apiError } from "@/lib/api";
import { recordSchemas, RecordTable } from "@/lib/records";
async function save(request:Request,context:{params:Promise<{table:string}>},editing:boolean){try{
 const {supabase,company}=await requireWorkspace();const {table}=await context.params;
 if(!Object.hasOwn(recordSchemas,table))throw new ApiError(404,"Module not found");
 const input=await request.json();const id=editing?z.string().uuid().parse(input.id):null;
 const data=recordSchemas[table as RecordTable].parse(input) as Record<string,unknown>;
 for(const [key,target] of [["contact_id","contacts"],["vehicle_id","vehicles"],["case_id","collision_cases"]]){if(data[key]){const {data:related,error}=await supabase.from(target).select("*").eq("id",data[key]).eq("company_id",company.id).single();if(error||!related)throw new ApiError(400,"Related record is outside this workspace");if(key==="case_id"&&["estimates","appointments"].includes(table)){data.contact_id=related.contact_id;data.vehicle_id=related.vehicle_id;}}}
 if(table==="estimates"){data.total=Number(data.subtotal)+Number(data.tax);}
 const payload={...data,company_id:company.id};
 const query=id?supabase.from(table).update(payload).eq("id",id).eq("company_id",company.id):supabase.from(table).insert(payload);
 const {data:saved,error}=await query.select("*").single();if(error)throw error;
 return NextResponse.json({ok:true,record:saved},{status:id?200:201});
}catch(error){return apiError(error);}}
export async function POST(request:Request,context:{params:Promise<{table:string}>}){return save(request,context,false);}
export async function PATCH(request:Request,context:{params:Promise<{table:string}>}){return save(request,context,true);}
