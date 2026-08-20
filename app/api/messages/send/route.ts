import { NextResponse } from "next/server";
import { z } from "zod";
import { sendInstagramText, sendWhatsAppText } from "@/lib/meta";
import { sendSmsText } from "@/lib/sms";

const schema=z.object({channel:z.enum(["sms","instagram","whatsapp"]),to:z.string().min(3),body:z.string().min(1).max(4096)});
export async function POST(request:Request){
  try{
    const input=schema.parse(await request.json());
    const result=input.channel==="sms"?await sendSmsText(input.to,input.body):input.channel==="instagram"?await sendInstagramText(input.to,input.body):await sendWhatsAppText(input.to,input.body);
    return NextResponse.json({ok:true,channel:input.channel,result});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unknown error"},{status:400})}
}
