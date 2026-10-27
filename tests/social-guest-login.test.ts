import test from "node:test";
import assert from "node:assert/strict";
import {guestOrderNeedsProtection, googleLoginAction} from "../packages/staff-ui/social-policy";

test("empty anonymous sessions allow Google existing-account sign-in and Kakao", () => {
  const guest={uid:"guest-fixture",isAnonymous:true};
  const protect=guestOrderNeedsProtection(guest,()=>null);
  assert.equal(protect,false);
  assert.equal(googleLoginAction(true,protect),"signIn");
});
test("all previous and current guest order records preserve the anonymous account", () => {
  const guest={uid:"guest-fixture",isAnonymous:true};
  for(const prefix of ["smartspace-pending:","smartspace-receipt:","smartspace-guest-history:",
    "paybridge:scenario-pending:","paybridge:scenario-receipt:"]) {
    const records=new Map([[prefix+guest.uid,"fixture-order"]]);
    const protect=guestOrderNeedsProtection(guest,key=>records.get(key)||null);
    assert.equal(protect,true,prefix);
    assert.equal(googleLoginAction(true,protect),"link",prefix);
  }
});
test("another user's order or a saved selection never blocks a new guest login", () => {
  const records=new Map([["smartspace-receipt:another-user","fixture"],
    ["paybridge:scenario-draft:v1","[]"]]);
  assert.equal(guestOrderNeedsProtection({uid:"guest",isAnonymous:true},key=>records.get(key)||null),false);
});
test("members and signed-out users use ordinary login without reading guest storage", () => {
  const read=()=>{throw Error("must not read")};
  assert.equal(guestOrderNeedsProtection(null,read),false);
  assert.equal(guestOrderNeedsProtection({uid:"member",isAnonymous:false},read),false);
  assert.equal(googleLoginAction(false,true),"signIn");
});
test("unreadable guest storage keeps order protection enabled", () => {
  const protect=guestOrderNeedsProtection({uid:"guest",isAnonymous:true},()=>{throw Error("storage unavailable")});
  assert.equal(protect,true);
  assert.equal(googleLoginAction(true,protect),"link");
});
