import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTwilioSignature } from "@/lib/sms";
export const runtime="nodejs";
export async function POST(request:Request){try{
 if(!process.env.TWILIO_AUTH_TOKEN)return new NextResponse("SMS not configured",{status:503});
 const form=await request.formData();const params=Object.fromEntries([...form.entries()].map(([k,v])=>[k,String(v)]));
 const callback=params.MessageStatus?process.env.TWILIO_STATUS_CALLBACK_URL:process.env.TWILIO_WEBHOOK_URL;
 if(!callback||!verifyTwilioSignature(callback,params,request.headers.get("x-twilio-signature")))return new NextResponse("Invalid signature",{status:401});
 if(params.AccountSid!==process.env.TWILIO_ACCOUNT_SID)return new NextResponse("Invalid account",{status:403});
 const admin=createAdminClient();
 if(params.MessageStatus){if(!params.MessageSid)return new NextResponse("Bad Request",{status:400});const{error}=await admin.from("repair_updates").update({sms_status:params.MessageStatus}).eq("sms_sid",params.MessageSid);if(error)throw error;return new NextResponse("OK");}
 if(!params.From||!params.To||!params.MessageSid)return new NextResponse("Bad Request",{status:400});
 const{data:connection,error}=await admin.from("channel_connections").select("company_id").eq("provider","sms").eq("external_account_id",params.To).eq("status","active").maybeSingle();if(error)throw error;if(!connection)return new NextResponse("SMS workspace not configured",{status:503});
 const{error:saveError}=await admin.rpc("receive_nachos_sms",{p_company_id:connection.company_id,p_payload:params});if(saveError)throw saveError;
 return new NextResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>",{headers:{"Content-Type":"text/xml"}});
}catch(error){console.error("SMS webhook failed",error);return new NextResponse("Unable to persist message",{status:503});}}
