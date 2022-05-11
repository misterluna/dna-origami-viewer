class OrigamiSimulator {
  staples: OrigamiStaple[];
  scaffold: OrigamiScaffold;
  threshold: number;

  constructor(staples, scaffold, threshold = 10) {
    this.staples = staples;
    this.scaffold = scaffold;
    this.threshold = threshold;
  }

  activateKinetics(duration: number, delta: number): void {
    for (let i = 0; i < duration; i += delta) {
      let _ = this.staples.map((staple) => staple.nextPosition(delta));
      let stapleBoundaryBoxes = this.staples.map((staple) =>
        staple.boundaryBox()
      );
      for (let j = 0; j < stapleBoundaryBoxes.length; j++) {
        if (
          this.boundaryBoxViolation(
            stapleBoundaryBoxes[j],
            this.scaffold.boundaryBox()
          )
        ) {
          let staple = this.staples[j];
          let { nucleotides, startIdx, endIdx } =
            this.attachedNucleotides(staple);
          if (nucleotides.length > this.threshold) {
            this.scaffold.attach(staple, startIdx, endIdx);
            staple.freeze();
            this.staples.concat(OrigamiStaple.fake(staple, startIdx, endIdx));
          }
        }
      }

      if (this.staples.filter((staple) => staple.velocity > 0)) {
        return;
      }
    }
  }

  deactivateKinetics(): void {}

  boundaryBoxViolation(bb1: THREE.Box3, bb2: THREE.Box3): boolean {
    return false;
  }

  attachedNucleotides(staple: OrigamiStaple): {
    nucleotides: DNANucleotide[];
    startIdx: number;
    endIdx: number;
  } {
    return { nucleotides: [], startIdx: 0, endIdx: 0 };
  }
}

type Tuple = [number, number];

type Sequence = {sequence: string, startingId: number}

type Bond = Tuple[];

function extractFromScene(): {
  scaffold: OrigamiScaffold;
  staples: OrigamiStaple[];
} {
  // const scaffold_complimentary = scaffold.map((value: BasicElement, index: number):boolean => {
  //   (value as DNANucleotide).getComplimentaryType
  // });
  const system = Array.from(elements.values())[0].strand.isCircular();
  let scaffolds: Strand[] = [];
  let staples: Strand[] = [];
  Array.from(elements.values()).forEach((e) => {
    const strand = e?.strand;
    if (!strand) {
      return;
    }
    if (strand.isCircular() && !scaffolds.includes(strand)) {
      scaffolds.push(strand);
    } else if (!staples.includes(strand)) {
      staples.push(strand);
    }
  });
  if (scaffolds.length !== 1) {
    notify("Cannot run OrigamiSimulator without exactly 1 scaffold");
  }
  const scaffold = scaffolds[0];
  return { scaffold, staples };
}

function LCS(
  seq1: Sequence,
  seq2: Sequence,
): { idx1: number; idx2: number; length: number; substring: string } {
  let substring = "";
  let lenStr1 = seq1.sequence.length;
  let idx1 = 0;
  let idx2 = 0;
  if (lenStr1 > 0) {
    for (let i = 0; i < lenStr1; i++) {
      for (let j = 0; j < lenStr1 - i + 1; j++) {
        if (j > substring.length && seq2.sequence.includes(seq1.sequence.slice(i, i + j))) {
          substring = seq1.sequence.slice(i, i + j);
        }
      }
    }
    idx1 = seq1.sequence.indexOf(substring) + seq1.startingId;
    idx2 = seq2.sequence.indexOf(substring) + seq2.startingId;
  }
  return { idx1, idx2, length: substring.length, substring };
}

function getBond(
  seq1: Sequence,
  seq2: Sequence
): { bond: Bond; remainingScaffold: string; remainingStaple: string; length: number } {
  const { idx1, idx2, length: bondLength, substring } = LCS(seq1, seq2);
  let pos1 = idx1;
  let pos2 = idx2;
  let bond: Bond = [];
  for (let _ = 0; _ < bondLength; _++) {
    const nucleotidePair: Tuple = [pos1, pos2];
    pos1++;
    pos2++;
    bond.push(nucleotidePair);
  }
  // n3 --> 0 
  // 0123 4567 89AB
  // AAAA TTTT GGGG
  const remainingScaffold = seq1.sequence.replace(substring, "");
  const remainingStaple = seq2.sequence.replace(substring, "");
  return { bond, remainingScaffold, remainingStaple };
}

function findAllBonds(str1: Sequence, str2: Sequence): Bond[] {
  const allBonds: Bond[] = [];
  let { bond, remainingScaffold, remainingStaple, length } = getBond(str1, str2);
  while (length > 1) {
    allBonds.push(bond);
    { bond, remainingScaffold, remainingStaple, length } = getBond(remainingScaffold, remainingStaple);
  }
  return allBonds;
}

function makeTraps(pair: Tuple): void {
  let STIFFNESS = 0.09;
  let selection = [];
  selection.push(elements.get(pair[0]));
  selection.push(elements.get(pair[1]));
  // For every other element in selection
  for (let i = 0; i < selection.length; i += 2) {
    // If there is another nucleotide in the pair
    if (selection[i + 1] !== undefined) {
      //create mutual trap data for the 2 nucleotides in a pair - selected simultaneously
      let trapA = new MutualTrap();
      trapA.set(selection[i], selection[i + 1], STIFFNESS);
      forces.push(trapA);

      let trapB = new MutualTrap();
      trapB.set(selection[i + 1], selection[i], STIFFNESS);
      forces.push(trapB);
    } else {
      //if there is no 2nd nucleotide in the pair
      notify(
        "The last selected base does not have a pair and thus cannot be included in the Mutual Trap File."
      ); //give error message
    }
  }
  if (!forceHandler) {
    forceHandler = new ForceHandler(forces);
  } else {
    forceHandler.set(forces);
  }
}

function setupSimulation() {
  const { scaffold, staples } = extractFromScene();
  const {complementaryScaffold, indices} = scaffold.getComplementaryStrings();

  //  Run LCS
  const stapleTo = new Map<number, Bond[]>();
  staples.forEach((staple, stapleIndex) => {
    bonds = findAllBonds(complementaryScaffold, staple)
    bonds.set(stapleIndex, )
  });

  const trapPairs = [...bonds.values()];
  trapPairs.forEach((trapPairs) => makeTraps(trapPairs));

  document.getElementById("test123").innerHTML =
    "<p>simulation setup complete</p>";
}
