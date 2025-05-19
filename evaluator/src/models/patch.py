from dataclasses import dataclass
from constants import PatchFormat

@dataclass
class Patch:
    path: str
    contract_file: str
    main: str
    format: PatchFormat

    def __post_init__(self):
        self._validate_format()

    def _validate_format(self) -> None:
        if isinstance(self.format, PatchFormat):
            if self.format == PatchFormat.SOLIDITY_PATCH:
                if not self.path.endswith('.sol'):
                    raise ValueError(f"Patch file must be a Solidity file (.sol): {self.path}")
            elif self.format == PatchFormat.BYTECODE_PATCH:
                if not self.path.endswith('.bin'):
                    raise ValueError(f"Patch file must be a Bytecode file (.bin): {self.path}")
        else:
            raise ValueError(f"Invalid patch format: {self.format}. Must be one of {list(PatchFormat)}")

    def get_contract_file(self) -> str:
        return self.contract_file

    def get_path(self) -> str:
        return self.path

    def get_main(self) -> str:
        return self.main