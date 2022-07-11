import { round, RoundingMode } from "https://deno.land/x/math@v1.1.0/mod.ts";

const diffs = ["ExpertPlusLawless.dat", "ExpertStandard.dat"];

diffs.forEach(diff => {
    let map = JSON.parse(Deno.readTextFileSync(diff));
    traverse(map);
    Deno.writeTextFileSync(diff, JSON.stringify(map, null, 0))
})

function traverse(json: any, decimals = 6) {
    for (const key in json) {
        const element = json[key]

        if (typeof(element) === "number") {
            json[key] = parseFloat(round(element as number, decimals, 2 /* RoundingMode.RoundHalfEven*/))
        } else if (element instanceof Object) {
            traverse(element)
        }
    }
}
